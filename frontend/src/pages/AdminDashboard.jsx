import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { BadgeCheck, Eye, EyeOff, X, Building2, Plus, Edit, Power } from "lucide-react";
import { STRUCTURE_TYPES, labelFromKey } from "@/lib/constants";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("intervenants");
  const [list, setList] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [structures, setStructures] = useState([]);
  const [editingStructure, setEditingStructure] = useState(null);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const [i, c, s] = await Promise.all([
      api.get("/admin/intervenants"),
      api.get("/admin/callbacks"),
      api.get("/admin/structures"),
    ]);
    setList(i.data); setCallbacks(c.data); setStructures(s.data); setLoading(false);
  }

  useEffect(() => { if (user && user.role === "admin") reload(); }, [user]);

  if (user === null) return <div className="p-8">Chargement…</div>;
  if (!user || user.role !== "admin") return <Navigate to="/admin/login" />;

  async function validate(id, verified) {
    const url = verified ? `/admin/intervenants/${id}/unvalidate-diploma` : `/admin/intervenants/${id}/validate-diploma`;
    await api.post(url);
    await reload();
  }
  async function toggleHidden(id) {
    await api.post(`/admin/intervenants/${id}/toggle-hidden`);
    await reload();
  }

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6" data-testid="admin-dashboard">
      <h1 className="font-heading font-bold text-3xl md:text-4xl">Espace administrateur</h1>
      <div className="inline-flex bg-white border-2 border-[#E5E7EB] rounded-xl p-1 flex-wrap">
        <button onClick={() => setTab("intervenants")} data-testid="admin-tab-intervenants" className={`px-4 py-2 rounded-lg font-semibold ${tab === "intervenants" ? "bg-[#2D6A4F] text-white" : ""}`}>Intervenants ({list.length})</button>
        <button onClick={() => setTab("callbacks")} data-testid="admin-tab-callbacks" className={`px-4 py-2 rounded-lg font-semibold ${tab === "callbacks" ? "bg-[#2D6A4F] text-white" : ""}`}>Demandes de rappel ({callbacks.length})</button>
        <button onClick={() => setTab("structures")} data-testid="admin-tab-structures" className={`px-4 py-2 rounded-lg font-semibold ${tab === "structures" ? "bg-[#2D6A4F] text-white" : ""}`}>Structures ({structures.length})</button>
      </div>

      {loading && <div>Chargement…</div>}

      {!loading && tab === "intervenants" && (
        <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="bg-[#F9F8F6]">
                <Th>Nom</Th><Th>Ville</Th><Th>Diplôme</Th><Th>Statut</Th><Th>Dernière MAJ</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((i) => (
                <tr key={i.id} data-testid={`admin-row-${i.id}`} className={`border-t-2 border-[#E5E7EB] ${i.hidden ? "opacity-60" : ""}`}>
                  <Td><div className="font-semibold">{i.first_name} {i.last_name}</div><div className="text-sm text-[#4B5563]">{i.publics?.join(", ")}</div></Td>
                  <Td>{i.city}</Td>
                  <Td>
                    <div className="text-sm">{i.diploma || "—"}</div>
                    {i.diploma_verified ? (
                      <span className="inline-flex items-center gap-1 text-[#2D6A4F] text-sm font-semibold"><BadgeCheck className="w-4 h-4" /> Vérifié</span>
                    ) : (<span className="text-sm text-[#B85042] font-semibold">À vérifier</span>)}
                  </Td>
                  <Td>
                    {i.available_today ? <span className="text-[#B85042] font-semibold">Aujourd'hui</span>
                      : i.available_this_week ? <span className="text-[#2D6A4F] font-semibold">Cette semaine</span>
                      : <span className="text-[#4B5563]">Non dispo</span>}
                  </Td>
                  <Td className="text-sm">{i.last_availability_update ? new Date(i.last_availability_update).toLocaleString("fr-FR") : "—"}</Td>
                  <Td>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => validate(i.id, i.diploma_verified)} data-testid={`admin-validate-${i.id}`} className="px-3 py-2 rounded-lg bg-[#2D6A4F] text-white text-sm font-semibold inline-flex items-center gap-1">
                        <BadgeCheck className="w-4 h-4" /> {i.diploma_verified ? "Retirer" : "Valider"}
                      </button>
                      <button onClick={() => toggleHidden(i.id)} data-testid={`admin-hide-${i.id}`} className="px-3 py-2 rounded-lg border-2 border-[#E5E7EB] text-sm font-semibold inline-flex items-center gap-1">
                        {i.hidden ? <><Eye className="w-4 h-4" /> Afficher</> : <><EyeOff className="w-4 h-4" /> Masquer</>}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && tab === "callbacks" && (
        <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-x-auto">
          {callbacks.length === 0 && <div className="p-8 text-center text-[#4B5563]">Aucune demande de rappel.</div>}
          {callbacks.length > 0 && (
            <table className="w-full text-base">
              <thead>
                <tr className="bg-[#F9F8F6]">
                  <Th>Date</Th><Th>Prénom</Th><Th>Téléphone</Th><Th>Email</Th><Th>Ville</Th><Th>Besoin</Th><Th>Message</Th><Th>Intervenant</Th><Th>Statut</Th>
                </tr>
              </thead>
              <tbody>
                {callbacks.map((c) => (
                  <tr key={c.id} data-testid={`cb-row-${c.id}`} className="border-t-2 border-[#E5E7EB] align-top">
                    <Td className="text-sm whitespace-nowrap">{new Date(c.created_at).toLocaleString("fr-FR")}</Td>
                    <Td>{c.first_name}</Td>
                    <Td>{c.phone || (c.contact && !c.email ? c.contact : "—")}</Td>
                    <Td>{c.email || "—"}</Td>
                    <Td>{c.city}</Td>
                    <Td>{c.need}</Td>
                    <Td className="max-w-xs text-sm">{c.message || "—"}</Td>
                    <Td className="text-sm">{c.intervenant_name}</Td>
                    <Td><AdminStatusBadge status={c.status} /></Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!loading && tab === "structures" && (
        <div className="space-y-3" data-testid="admin-structures-tab">
          <div className="flex justify-end">
            <button onClick={() => setEditingStructure({})} data-testid="admin-structure-new" className="inline-flex items-center gap-2 min-h-[44px] px-4 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl font-semibold">
              <Plus className="w-4 h-4" /> Ajouter une structure
            </button>
          </div>

          {structures.length === 0 && (
            <div className="bg-white border-2 border-dashed border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">Aucune structure enregistrée.</div>
          )}

          <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="bg-[#F9F8F6]">
                  <Th>Nom</Th><Th>Type</Th><Th>Ville</Th><Th>Contact</Th><Th>Statut</Th><Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <tr key={s.id} data-testid={`admin-structure-${s.id}`} className={`border-t-2 border-[#E5E7EB] ${s.status === "inactive" ? "opacity-60" : ""}`}>
                    <Td><div className="font-semibold inline-flex items-center gap-2"><Building2 className="w-4 h-4 text-[#2D6A4F]" /> {s.name}</div>{s.address && <div className="text-xs text-[#4B5563]">{s.address}</div>}</Td>
                    <Td className="text-sm">{labelFromKey(STRUCTURE_TYPES, s.type)}</Td>
                    <Td>{s.city}</Td>
                    <Td className="text-sm">
                      {s.phone && <div>{s.phone}</div>}
                      {s.email && <div>{s.email}</div>}
                      {s.website && <a href={s.website} target="_blank" rel="noreferrer" className="text-[#2D6A4F] underline">site</a>}
                    </Td>
                    <Td>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.status === "active" ? "bg-[#74A57F] text-white" : "bg-[#4B5563] text-white"}`}>
                        {s.status === "active" ? "Actif" : "Inactif"}
                      </span>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setEditingStructure(s)} data-testid={`admin-structure-edit-${s.id}`} className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold">
                          <Edit className="w-4 h-4" /> Modifier
                        </button>
                        <button
                          onClick={async () => {
                            await api.patch(`/admin/structures/${s.id}/status`, { status: s.status === "active" ? "inactive" : "active" });
                            reload();
                          }}
                          data-testid={`admin-structure-toggle-${s.id}`}
                          className="inline-flex items-center gap-1 px-3 py-2 border-2 border-[#E5E7EB] rounded-lg text-sm font-semibold"
                        >
                          <Power className="w-4 h-4" /> {s.status === "active" ? "Désactiver" : "Activer"}
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editingStructure && <StructureFormDialog s={editingStructure} onClose={(saved) => { setEditingStructure(null); if (saved) reload(); }} />}
    </div>
  );
}

function StructureFormDialog({ s, onClose }) {
  const isEdit = !!s.id;
  const [form, setForm] = useState({
    name: s.name || "", type: s.type || "association",
    city: s.city || "", address: s.address || "",
    phone: s.phone || "", email: s.email || "", website: s.website || "",
    description: s.description || "", accessibility_info: s.accessibility_info || "",
    lat: s.lat ?? null, lng: s.lng ?? null,
  });
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const cls = "w-full min-h-[48px] px-4 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";

  function setF(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setErr(""); setSaving(true);
    try {
      const payload = {
        ...form,
        lat: form.lat === "" || form.lat === null ? null : parseFloat(form.lat),
        lng: form.lng === "" || form.lng === null ? null : parseFloat(form.lng),
      };
      if (isEdit) await api.put(`/admin/structures/${s.id}`, payload);
      else await api.post("/admin/structures", payload);
      onClose(true);
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" data-testid="structure-form-dialog">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-bold text-2xl">{isEdit ? "Modifier la structure" : "Nouvelle structure"}</h3>
          <button onClick={() => onClose(false)} className="p-2"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Lbl label="Nom *"><input data-testid="sf-name" required className={cls} value={form.name} onChange={(e) => setF("name", e.target.value)} /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="Type">
              <select data-testid="sf-type" className={cls} value={form.type} onChange={(e) => setF("type", e.target.value)}>
                {STRUCTURE_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
              </select>
            </Lbl>
            <Lbl label="Ville *"><input data-testid="sf-city" required className={cls} value={form.city} onChange={(e) => setF("city", e.target.value)} /></Lbl>
          </div>
          <Lbl label="Adresse"><input data-testid="sf-address" className={cls} value={form.address} onChange={(e) => setF("address", e.target.value)} /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="Téléphone"><input data-testid="sf-phone" className={cls} value={form.phone} onChange={(e) => setF("phone", e.target.value)} /></Lbl>
            <Lbl label="Email"><input type="email" data-testid="sf-email" className={cls} value={form.email} onChange={(e) => setF("email", e.target.value)} /></Lbl>
          </div>
          <Lbl label="Site web"><input type="url" data-testid="sf-website" className={cls} value={form.website} onChange={(e) => setF("website", e.target.value)} placeholder="https://" /></Lbl>
          <Lbl label="Description"><textarea rows={2} data-testid="sf-desc" className={`${cls} py-3`} value={form.description} onChange={(e) => setF("description", e.target.value)} /></Lbl>
          <Lbl label="Accessibilité (PMR, ascenseur, …)"><input data-testid="sf-access" className={cls} value={form.accessibility_info} onChange={(e) => setF("accessibility_info", e.target.value)} /></Lbl>
          <div className="grid grid-cols-2 gap-3">
            <Lbl label="Latitude"><input type="number" step="0.0001" data-testid="sf-lat" className={cls} value={form.lat ?? ""} onChange={(e) => setF("lat", e.target.value)} /></Lbl>
            <Lbl label="Longitude"><input type="number" step="0.0001" data-testid="sf-lng" className={cls} value={form.lng ?? ""} onChange={(e) => setF("lng", e.target.value)} /></Lbl>
          </div>
          {err && <div className="text-[#B85042] font-semibold">{err}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => onClose(false)} className="flex-1 min-h-[48px] border-2 border-[#E5E7EB] rounded-xl font-semibold">Annuler</button>
            <button type="submit" disabled={saving} data-testid="sf-submit" className="flex-1 min-h-[48px] bg-[#2D6A4F] hover:bg-[#1B4332] disabled:opacity-60 text-white rounded-xl font-semibold">
              {saving ? "Enregistrement…" : (isEdit ? "Enregistrer" : "Créer")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Lbl({ label, children }) {
  return (
    <label className="block">
      <div className="text-base font-semibold text-[#1C1917] mb-2">{label}</div>
      {children}
    </label>
  );
}

const Th = ({ children }) => <th className="p-3 text-left font-semibold text-[#1C1917]">{children}</th>;
const Td = ({ children, className = "" }) => <td className={`p-3 ${className}`}>{children}</td>;

function AdminStatusBadge({ status }) {
  const map = {
    new: { label: "Nouvelle", cls: "bg-[#B85042] text-white" },
    contacted: { label: "Contacté", cls: "bg-[#74A57F] text-white" },
    closed: { label: "Clôturée", cls: "bg-[#4B5563] text-white" },
  };
  const s = map[status] || map.new;
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${s.cls}`}>{s.label}</span>;
}
