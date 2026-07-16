import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod/v3";

const TEMPLATE_URI = "ui://widget/apa-connect-vercel-v1.html";
const SITE_URL = String(process.env.APA_CONNECT_SITE_URL || "").trim();
const RAW_API_URL =
  process.env.APA_CONNECT_API_URL || process.env.REACT_APP_BACKEND_URL || "";

const WIDGET_HTML = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>APA Connect</title>
<style>
:root{font-family:Inter,system-ui,sans-serif;color-scheme:light dark;--g:#2d6a4f;--gd:#1b4332;--b:#dfe7e1;--s:light-dark(#fff,#171b18);--ss:light-dark(#f4f7f4,#222823);--t:light-dark(#172019,#f5f7f5);--m:light-dark(#617065,#adb9b0)}*{box-sizing:border-box}body{margin:0;background:transparent;color:var(--t)}button{font:inherit;cursor:pointer}.wrap{padding:10px}.app{overflow:hidden;border:1px solid var(--b);border-radius:22px;background:var(--s)}header{display:flex;align-items:center;gap:12px;padding:18px;background:linear-gradient(135deg,var(--gd),var(--g));color:#fff}.logo{display:grid;width:44px;height:44px;place-items:center;border-radius:14px;background:#ffffff24;font-size:22px}h1,h2,h3,p{margin:0}header p{margin-top:3px;font-size:12px;color:#ffffffcf}.body{padding:18px}.hero{display:grid;gap:12px}.hero p,.summary,.desc{color:var(--m);line-height:1.45}.actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}.quick,.card{border:1px solid var(--b);border-radius:17px;background:var(--ss);padding:14px;color:var(--t);text-align:left}.quick{min-height:95px}.quick strong{display:block;margin-top:8px}.quick small{color:var(--m)}.cards{display:grid;gap:11px;margin-top:14px}.card h3{font-size:16px}.sub{margin-top:4px;color:var(--m);font-size:12px}.desc{margin-top:10px;font-size:13px}.badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}.badge{border-radius:99px;background:var(--s);padding:5px 8px;color:var(--m);font-size:11px;font-weight:700}.green{background:light-dark(#d8f3dc,#274b37);color:light-dark(var(--gd),#d7f7df)}.details{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}.detail{border-radius:11px;background:var(--s);padding:8px}.detail span{display:block;color:var(--m);font-size:10px;text-transform:uppercase}.detail strong{display:block;margin-top:3px;font-size:12px}.primary{margin-top:12px;border:0;border-radius:11px;background:var(--g);padding:9px 12px;color:#fff;font-weight:800}.empty{margin-top:14px;border:1px dashed var(--b);border-radius:16px;padding:24px;color:var(--m);text-align:center}@media(max-width:520px){.actions,.details{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap"><section class="app"><header><div class="logo">🌿</div><div><h1>APA Connect</h1><p>Activité physique adaptée près de chez vous</p></div></header><main id="body" class="body"></main></section></div>
<script>
const root=document.getElementById('body');let data=window.openai?.toolOutput||null;
const esc=(v)=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function follow(text){if(window.openai?.sendFollowUpMessage){window.openai.sendFollowUpMessage({prompt:text});return}window.parent.postMessage({jsonrpc:'2.0',method:'ui/message',params:{role:'user',content:[{type:'text',text}]}},'*')}
function home(d={}){root.innerHTML='<div class="hero"><h2>'+esc(d.title||'APA Connect')+'</h2><p>'+esc(d.summary||'Trouvez un intervenant ou un cours adapté.')+'</p><div class="actions"><button class="quick" data-q="Trouve-moi un intervenant APA près de chez moi.">🧑‍⚕️<strong>Trouver un intervenant</strong><small>Disponibilité, domicile, diplôme vérifié</small></button><button class="quick" data-q="Trouve-moi un cours sur chaise près de chez moi.">🪑<strong>Trouver un cours</strong><small>Cours sur chaise et mobilité douce</small></button></div></div>'}
function card(i){const badges=[];if(i.verified)badges.push('<span class="badge green">✓ Diplôme vérifié</span>');if(i.availableToday)badges.push('<span class="badge green">Disponible aujourd’hui</span>');if(i.availableThisWeek&&!i.availableToday)badges.push('<span class="badge">Disponible cette semaine</span>');if(i.homeVisit)badges.push('<span class="badge">🏠 Domicile</span>');if(i.adaptedChairClass)badges.push('<span class="badge green">🪑 Cours sur chaise</span>');const details=i.itemType==='class'?'<div class="details"><div class="detail"><span>Date</span><strong>'+esc(i.date||'À préciser')+' '+esc(i.startTime||'')+'</strong></div><div class="detail"><span>Places</span><strong>'+esc(i.placesLeft??'À confirmer')+'</strong></div><div class="detail"><span>Durée</span><strong>'+esc(i.durationMinutes||60)+' min</strong></div><div class="detail"><span>Tarif</span><strong>'+esc(Number(i.price||0)?i.price+' €':'Gratuit')+'</strong></div></div>':'';const prompt=i.itemType==='class'?'Je souhaite réserver le cours « '+i.title+' » (identifiant '+i.id+'). Aide-moi à fournir mes coordonnées et à confirmer la réservation.':'Je souhaite être rappelé par '+i.title+' (identifiant '+i.id+'). Aide-moi à fournir mes coordonnées et mon besoin.';return '<article class="card"><h3>'+esc(i.title)+'</h3><p class="sub">'+esc([i.city,i.subtitle].filter(Boolean).join(' · '))+'</p>'+(i.description?'<p class="desc">'+esc(i.description)+'</p>':'')+'<div class="badges">'+badges.join('')+'</div>'+details+'<button class="primary" data-follow="'+esc(prompt)+'">'+(i.itemType==='class'?'Réserver':'Demander un rappel')+'</button></article>'}
function render(d){data=d||data;if(!data||data.kind==='home'){home(data||{});return}if(data.kind==='action'){root.innerHTML='<div class="hero"><h2>'+(data.success?'✓ Action réalisée':'Action impossible')+'</h2><p>'+esc(data.message||'')+'</p></div>';return}const items=Array.isArray(data.items)?data.items:[];root.innerHTML='<h2>'+esc(data.title||'Résultats')+'</h2><p class="summary">'+esc(data.summary||'')+'</p>'+(items.length?'<div class="cards">'+items.map(card).join('')+'</div>':'<div class="empty">Aucun résultat pour ces critères.</div>')}
root.addEventListener('click',e=>{const q=e.target.closest('[data-q]');if(q)follow(q.dataset.q);const b=e.target.closest('[data-follow]');if(b)follow(b.dataset.follow)});
window.addEventListener('openai:set_globals',e=>render(e.detail?.globals?.toolOutput));window.addEventListener('message',e=>{if(e.data?.method==='ui/notifications/tool-result')render(e.data.params?.structuredContent)});render(data);
</script>
</body>
</html>`;

function apiBase() {
  const value = String(RAW_API_URL || "").trim().replace(/\/+$/, "");
  if (!value) throw new Error("Le backend APA Connect n'est pas configuré sur Vercel.");
  return value.endsWith("/api") ? value : `${value}/api`;
}

async function callApi(path, options = {}) {
  const response = await fetch(`${apiBase()}${path}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const text = await response.text();
  let payload = text;
  try { payload = text ? JSON.parse(text) : null; } catch {}
  if (!response.ok) {
    const detail = payload && typeof payload === "object" ? payload.detail : payload;
    throw new Error(typeof detail === "string" ? detail : `Erreur HTTP ${response.status}`);
  }
  return payload;
}

function meta(invoking, invoked) {
  return {
    ui: { resourceUri: TEMPLATE_URI },
    "openai/outputTemplate": TEMPLATE_URI,
    "openai/toolInvocation/invoking": invoking,
    "openai/toolInvocation/invoked": invoked,
  };
}

function failure(error) {
  const message = error instanceof Error ? error.message : "Erreur inattendue";
  return { isError: true, content: [{ type: "text", text: `APA Connect : ${message}` }] };
}

function createServer() {
  const server = new McpServer({ name: "apa-connect", version: "1.0.0" });

  registerAppResource(server, "apa-connect-widget", TEMPLATE_URI, {}, async () => ({
    contents: [{
      uri: TEMPLATE_URI,
      mimeType: RESOURCE_MIME_TYPE,
      text: WIDGET_HTML,
      _meta: {
        ui: { prefersBorder: true, csp: { connectDomains: [], resourceDomains: [] } },
        "openai/widgetDescription": "Recherche d'intervenants et de cours APA avec réservation ou demande de rappel.",
      },
    }],
  }));

  registerAppTool(server, "open_apa_connect", {
    title: "Ouvrir APA Connect",
    description: "Use this when the user wants to open or discover APA Connect.",
    inputSchema: {},
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: meta("Ouverture d’APA Connect…", "APA Connect est prêt."),
  }, async () => ({
    structuredContent: {
      kind: "home",
      title: "APA Connect",
      summary: "Trouvez un professionnel APA ou un cours adapté, notamment sur chaise.",
      items: [],
      siteUrl: SITE_URL,
    },
    content: [{ type: "text", text: "APA Connect est ouvert." }],
  }));

  registerAppTool(server, "search_intervenants", {
    title: "Rechercher des intervenants APA",
    description: "Use this when the user is looking for an APA professional by city, availability, home visits or verified diploma.",
    inputSchema: {
      city: z.string().trim().optional(),
      available_today: z.boolean().optional(),
      available_week: z.boolean().optional(),
      home: z.boolean().optional(),
      verified: z.boolean().optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: meta("Recherche des intervenants…", "Intervenants trouvés."),
  }, async (input) => {
    try {
      const params = new URLSearchParams();
      Object.entries(input || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
      });
      const rows = await callApi(`/intervenants${params.size ? `?${params}` : ""}`);
      const items = (Array.isArray(rows) ? rows : []).map((p) => ({
        id: String(p.id || ""), itemType: "intervenant",
        title: `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Intervenant APA",
        city: p.city || "", subtitle: p.diploma || p.zone || "Professionnel APA",
        description: p.bio || "", verified: Boolean(p.diploma_verified),
        availableToday: Boolean(p.available_today), availableThisWeek: Boolean(p.available_this_week),
        homeVisit: Array.isArray(p.intervention_places) && p.intervention_places.includes("domicile"),
      }));
      return {
        structuredContent: {
          kind: "intervenants",
          title: input?.city ? `Intervenants APA près de ${input.city}` : "Intervenants APA",
          summary: `${items.length} résultat${items.length > 1 ? "s" : ""}.`, items, siteUrl: SITE_URL,
        },
        content: [{ type: "text", text: `${items.length} intervenant(s) trouvé(s).` }],
      };
    } catch (error) { return failure(error); }
  });

  registerAppTool(server, "search_classes", {
    title: "Rechercher des cours APA",
    description: "Use this when the user wants an adapted physical activity class, especially a chair-based class.",
    inputSchema: {
      city: z.string().trim().optional(),
      chair: z.boolean().optional(),
      category: z.enum(["cours_sur_chaise","mobilite_douce","prevention_chutes","renforcement_doux","respiration_relaxation","equilibre","autre"]).optional(),
    },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    _meta: meta("Recherche des cours…", "Cours trouvés."),
  }, async ({ city, chair = true, category }) => {
    try {
      const params = new URLSearchParams({ chair: String(chair) });
      if (city) params.set("city", city);
      if (category) params.set("category", category);
      const rows = await callApi(`/classes?${params}`);
      const items = (Array.isArray(rows) ? rows : []).map((c) => ({
        id: String(c.id || ""), itemType: "class", title: c.title || "Cours APA",
        city: c.city || "", subtitle: c.intervenant_name || c.structure_name || "Cours adapté",
        description: c.description || "", date: c.date || "", startTime: c.start_time || "",
        durationMinutes: Number(c.duration_minutes || 60), price: Number(c.price || 0),
        placesLeft: Number(c.places_left || 0), adaptedChairClass: Boolean(c.adapted_chair_class),
      }));
      return {
        structuredContent: {
          kind: "classes", title: city ? `Cours adaptés près de ${city}` : "Cours APA",
          summary: `${items.length} cours trouvé${items.length > 1 ? "s" : ""}.`, items, siteUrl: SITE_URL,
        },
        content: [{ type: "text", text: `${items.length} cours trouvé(s).` }],
      };
    } catch (error) { return failure(error); }
  });

  registerAppTool(server, "request_callback", {
    title: "Demander un rappel",
    description: "Use this only after the user explicitly requests contact with a specific professional and provides a phone number or email.",
    inputSchema: {
      intervenant_id: z.string().min(1), first_name: z.string().trim().min(1),
      phone: z.string().trim().optional(), email: z.string().trim().email().optional(),
      city: z.string().trim().optional(), need: z.string().trim().min(1), message: z.string().trim().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: { "openai/toolInvocation/invoking": "Envoi de la demande…", "openai/toolInvocation/invoked": "Demande envoyée." },
  }, async (input) => {
    try {
      if (!input.phone && !input.email) throw new Error("Un téléphone ou un email est nécessaire.");
      const result = await callApi("/callbacks", { method: "POST", body: input });
      return {
        structuredContent: { kind: "action", success: true, message: "Votre demande de rappel a été transmise.", referenceId: result?.id },
        content: [{ type: "text", text: "Votre demande de rappel a été transmise." }],
      };
    } catch (error) { return failure(error); }
  });

  registerAppTool(server, "book_class", {
    title: "Réserver un cours APA",
    description: "Use this only after the user explicitly asks to reserve a specific class and provides a name plus phone or email.",
    inputSchema: {
      class_id: z.string().min(1), name: z.string().trim().min(1),
      phone: z.string().trim().optional(), email: z.string().trim().email().optional(),
    },
    annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
    _meta: { "openai/toolInvocation/invoking": "Réservation du cours…", "openai/toolInvocation/invoked": "Cours réservé." },
  }, async ({ class_id, ...body }) => {
    try {
      if (!body.phone && !body.email) throw new Error("Un téléphone ou un email est nécessaire.");
      const result = await callApi(`/classes/${encodeURIComponent(class_id)}/book`, { method: "POST", body });
      return {
        structuredContent: { kind: "action", success: true, message: "Votre place est réservée.", referenceId: result?.id },
        content: [{ type: "text", text: "Votre place est réservée." }],
      };
    } catch (error) { return failure(error); }
  });

  return server;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "content-type,mcp-session-id,mcp-protocol-version,last-event-id");
  res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
  if (req.method === "OPTIONS") return res.status(204).end();

  const server = createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error("APA Connect MCP error", error);
    if (!res.headersSent) res.status(500).json({ error: "Erreur MCP APA Connect" });
  }
}

export const config = { maxDuration: 30 };
