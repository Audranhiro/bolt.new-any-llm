import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod/v3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env.PORT || 2091);
const MCP_PATH = "/mcp";
const TEMPLATE_URI = "ui://widget/apa-connect-v1.html";
const SITE_URL = (process.env.APA_CONNECT_SITE_URL || "").trim();
const API_BASE = normalizeApiBase(
  process.env.APA_CONNECT_API_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://127.0.0.1:8000",
);
const widgetHtml = readFileSync(
  join(__dirname, "public", "apa-connect-widget.html"),
  "utf8",
);

const classCategories = [
  "cours_sur_chaise",
  "mobilite_douce",
  "prevention_chutes",
  "renforcement_doux",
  "respiration_relaxation",
  "equilibre",
  "autre",
];

const resultItemSchema = z.object({
  id: z.string(),
  itemType: z.enum(["intervenant", "class"]),
  title: z.string(),
  city: z.string().optional(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  verified: z.boolean().optional(),
  availableToday: z.boolean().optional(),
  availableThisWeek: z.boolean().optional(),
  homeVisit: z.boolean().optional(),
  publics: z.array(z.string()).optional(),
  places: z.array(z.string()).optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  durationMinutes: z.number().optional(),
  price: z.number().optional(),
  capacity: z.number().optional(),
  placesLeft: z.number().optional(),
  category: z.string().optional(),
  adaptedChairClass: z.boolean().optional(),
});

const listOutputSchema = {
  kind: z.enum(["home", "intervenants", "classes"]),
  title: z.string(),
  summary: z.string(),
  items: z.array(resultItemSchema),
  siteUrl: z.string(),
};

const actionOutputSchema = {
  kind: z.literal("action"),
  success: z.boolean(),
  message: z.string(),
  referenceId: z.string().optional(),
};

function normalizeApiBase(value) {
  const base = String(value || "").trim().replace(/\/+$/, "");
  if (!base) {
    throw new Error("APA_CONNECT_API_URL est obligatoire");
  }
  return base.endsWith("/api") ? base : `${base}/api`;
}

function addOptionalParam(params, key, value) {
  if (value === undefined || value === null || value === "") return;
  params.set(key, String(value));
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && payload.detail
        ? payload.detail
        : payload || `Erreur HTTP ${response.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }

  return payload;
}

function toolFailure(error) {
  const message = error instanceof Error ? error.message : "Erreur inattendue";
  return {
    isError: true,
    content: [{ type: "text", text: `APA Connect : ${message}` }],
  };
}

function listMeta(invoking, invoked) {
  return {
    ui: { resourceUri: TEMPLATE_URI },
    "openai/outputTemplate": TEMPLATE_URI,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

function createApaConnectServer() {
  const server = new McpServer(
    { name: "apa-connect", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {} } },
  );

  registerAppResource(
    server,
    "apa-connect-widget",
    TEMPLATE_URI,
    {},
    async () => ({
      contents: [
        {
          uri: TEMPLATE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
            },
            "openai/widgetDescription":
              "Interface APA Connect pour afficher des intervenants et des cours d'activité physique adaptée, puis demander un rappel ou réserver.",
          },
        },
      ],
    }),
  );

  registerAppTool(
    server,
    "open_apa_connect",
    {
      title: "Ouvrir APA Connect",
      description:
        "Use this when the user wants to open, discover or understand the APA Connect application.",
      inputSchema: {},
      outputSchema: listOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: listMeta("Ouverture d’APA Connect…", "APA Connect est prêt."),
    },
    async () => {
      const structuredContent = {
        kind: "home",
        title: "APA Connect",
        summary:
          "Trouvez un professionnel de l’activité physique adaptée ou un cours doux près de chez vous.",
        items: [],
        siteUrl: SITE_URL,
      };
      return {
        structuredContent,
        content: [
          {
            type: "text",
            text: "APA Connect permet de rechercher des intervenants APA et des cours adaptés, notamment des cours sur chaise.",
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "search_intervenants",
    {
      title: "Rechercher des intervenants APA",
      description:
        "Use this when the user is looking for an activity-physical-adaptation professional by city, availability, home visits or verified diploma.",
      inputSchema: {
        city: z.string().trim().optional(),
        available_today: z.boolean().optional(),
        available_week: z.boolean().optional(),
        home: z.boolean().optional(),
        verified: z.boolean().optional(),
      },
      outputSchema: listOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: listMeta("Recherche des intervenants…", "Intervenants trouvés."),
    },
    async ({ city, available_today, available_week, home, verified }) => {
      try {
        const params = new URLSearchParams();
        addOptionalParam(params, "city", city?.trim());
        addOptionalParam(params, "available_today", available_today);
        addOptionalParam(params, "available_week", available_week);
        addOptionalParam(params, "home", home);
        addOptionalParam(params, "verified", verified);

        const data = await apiFetch(
          `/intervenants${params.size ? `?${params.toString()}` : ""}`,
        );
        const items = (Array.isArray(data) ? data : []).map((person) => ({
          id: String(person.id || ""),
          itemType: "intervenant",
          title: `${person.first_name || ""} ${person.last_name || ""}`.trim() ||
            "Intervenant APA",
          city: person.city || "",
          subtitle: person.diploma || person.zone || "Professionnel APA",
          description: person.bio || "",
          verified: Boolean(person.diploma_verified),
          availableToday: Boolean(person.available_today),
          availableThisWeek: Boolean(person.available_this_week),
          homeVisit: Array.isArray(person.intervention_places)
            ? person.intervention_places.includes("domicile")
            : false,
          publics: Array.isArray(person.publics) ? person.publics : [],
          places: Array.isArray(person.intervention_places)
            ? person.intervention_places
            : [],
        }));

        const structuredContent = {
          kind: "intervenants",
          title: city?.trim()
            ? `Intervenants APA près de ${city.trim()}`
            : "Intervenants APA",
          summary: `${items.length} intervenant${items.length > 1 ? "s" : ""} trouvé${items.length > 1 ? "s" : ""}.`,
          items,
          siteUrl: SITE_URL,
        };

        return {
          structuredContent,
          content: [
            {
              type: "text",
              text: items.length
                ? `${items.length} intervenant(s) APA correspondent à la recherche.`
                : "Aucun intervenant APA ne correspond actuellement à ces critères.",
            },
          ],
        };
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  registerAppTool(
    server,
    "search_classes",
    {
      title: "Rechercher des cours APA",
      description:
        "Use this when the user wants to find adapted physical activity classes, especially chair-based, gentle mobility or fall-prevention classes.",
      inputSchema: {
        city: z.string().trim().optional(),
        chair: z.boolean().optional(),
        category: z.enum(classCategories).optional(),
      },
      outputSchema: listOutputSchema,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: listMeta("Recherche des cours…", "Cours trouvés."),
    },
    async ({ city, chair = true, category }) => {
      try {
        const params = new URLSearchParams();
        addOptionalParam(params, "city", city?.trim());
        addOptionalParam(params, "chair", chair);
        addOptionalParam(params, "category", category);

        const data = await apiFetch(`/classes?${params.toString()}`);
        const items = (Array.isArray(data) ? data : []).map((course) => ({
          id: String(course.id || ""),
          itemType: "class",
          title: course.title || "Cours APA",
          city: course.city || "",
          subtitle: course.intervenant_name || course.structure_name || "Cours adapté",
          description: course.description || "",
          date: course.date || "",
          startTime: course.start_time || "",
          durationMinutes: Number(course.duration_minutes || 0),
          price: Number(course.price || 0),
          capacity: Number(course.capacity || 0),
          placesLeft: Number(course.places_left || 0),
          category: course.category || "",
          adaptedChairClass: Boolean(course.adapted_chair_class),
        }));

        const structuredContent = {
          kind: "classes",
          title: city?.trim()
            ? `Cours adaptés près de ${city.trim()}`
            : "Cours d’activité physique adaptée",
          summary: `${items.length} cours trouvé${items.length > 1 ? "s" : ""}.`,
          items,
          siteUrl: SITE_URL,
        };

        return {
          structuredContent,
          content: [
            {
              type: "text",
              text: items.length
                ? `${items.length} cours correspondent à la recherche.`
                : "Aucun cours ne correspond actuellement à ces critères.",
            },
          ],
        };
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  registerAppTool(
    server,
    "request_callback",
    {
      title: "Demander un rappel",
      description:
        "Use this only after the user explicitly asks to be contacted by a specific APA professional and provides a first name plus a phone number or email address.",
      inputSchema: {
        intervenant_id: z.string().min(1),
        first_name: z.string().trim().min(1),
        phone: z.string().trim().optional(),
        email: z.string().trim().email().optional(),
        city: z.string().trim().optional(),
        need: z.string().trim().min(1),
        message: z.string().trim().optional(),
      },
      outputSchema: actionOutputSchema,
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Envoi de la demande…",
        "openai/toolInvocation/invoked": "Demande envoyée.",
      },
    },
    async ({ intervenant_id, first_name, phone, email, city, need, message }) => {
      try {
        if (!phone?.trim() && !email?.trim()) {
          throw new Error("Un numéro de téléphone ou une adresse email est nécessaire.");
        }
        const data = await apiFetch("/callbacks", {
          method: "POST",
          body: {
            intervenant_id,
            first_name: first_name.trim(),
            phone: phone?.trim() || "",
            email: email?.trim() || "",
            city: city?.trim() || "",
            need: need.trim(),
            message: message?.trim() || "",
          },
        });
        const structuredContent = {
          kind: "action",
          success: true,
          message: "Votre demande de rappel a bien été transmise.",
          referenceId: data?.id ? String(data.id) : undefined,
        };
        return {
          structuredContent,
          content: [{ type: "text", text: structuredContent.message }],
        };
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  registerAppTool(
    server,
    "book_class",
    {
      title: "Réserver un cours APA",
      description:
        "Use this only after the user explicitly asks to reserve a specific class and provides their name plus a phone number or email address.",
      inputSchema: {
        class_id: z.string().min(1),
        name: z.string().trim().min(1),
        phone: z.string().trim().optional(),
        email: z.string().trim().email().optional(),
      },
      outputSchema: actionOutputSchema,
      annotations: {
        readOnlyHint: false,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        "openai/toolInvocation/invoking": "Réservation du cours…",
        "openai/toolInvocation/invoked": "Cours réservé.",
      },
    },
    async ({ class_id, name, phone, email }) => {
      try {
        if (!phone?.trim() && !email?.trim()) {
          throw new Error("Un numéro de téléphone ou une adresse email est nécessaire.");
        }
        const data = await apiFetch(`/classes/${encodeURIComponent(class_id)}/book`, {
          method: "POST",
          body: {
            name: name.trim(),
            phone: phone?.trim() || "",
            email: email?.trim() || "",
          },
        });
        const structuredContent = {
          kind: "action",
          success: true,
          message: "Votre place est réservée.",
          referenceId: data?.id ? String(data.id) : undefined,
        };
        return {
          structuredContent,
          content: [{ type: "text", text: structuredContent.message }],
        };
      } catch (error) {
        return toolFailure(error);
      }
    },
  );

  return server;
}

const httpServer = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS" && url.pathname.startsWith(MCP_PATH)) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "content-type, mcp-session-id",
      "Access-Control-Expose-Headers": "Mcp-Session-Id",
    });
    res.end();
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    res
      .writeHead(200, { "content-type": "application/json; charset=utf-8" })
      .end(
        JSON.stringify({
          ok: true,
          name: "APA Connect ChatGPT App",
          mcp: MCP_PATH,
          backend: API_BASE,
        }),
      );
    return;
  }

  const mcpMethods = new Set(["POST", "GET", "DELETE"]);
  if (
    url.pathname.startsWith(MCP_PATH) &&
    req.method &&
    mcpMethods.has(req.method)
  ) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");

    const server = createApaConnectServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error("Erreur MCP APA Connect", error);
      if (!res.headersSent) {
        res.writeHead(500).end("Internal server error");
      }
    }
    return;
  }

  res.writeHead(404).end("Not Found");
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`APA Connect MCP disponible sur http://0.0.0.0:${PORT}${MCP_PATH}`);
});
