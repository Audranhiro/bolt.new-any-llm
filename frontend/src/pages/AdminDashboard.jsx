import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { BadgeCheck, Eye, EyeOff, X } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("intervenants");
  const [list, setList] = useState([]);
  const [callbacks, setCallbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    setLoading(true);
    const [i, c] = await Promise.all([
      api.get("/admin/intervenants"),
      api.get("/admin/callbacks"),
    ]);
    setList(i.data); setCallbacks(c.data); setLoading(false);
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
      <div className="inline-flex bg-white border-2 border-[#E5E7EB] rounded-xl p-1">
        <button onClick={() => setTab("intervenants")} data-testid="admin-tab-intervenants" className={`px-4 py-2 rounded-lg font-semibold ${tab === "intervenants" ? "bg-[#2D6A4F] text-white" : ""}`}>Intervenants ({list.length})</button>
        <button onClick={() => setTab("callbacks")} data-testid="admin-tab-callbacks" className={`px-4 py-2 rounded-lg font-semibold ${tab === "callbacks" ? "bg-[#2D6A4F] text-white" : ""}`}>Demandes de rappel ({callbacks.length})</button>
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
                  <Th>Date</Th><Th>Prénom</Th><Th>Contact</Th><Th>Ville</Th><Th>Besoin</Th><Th>Message</Th><Th>Intervenant</Th>
                </tr>
              </thead>
              <tbody>
                {callbacks.map((c) => (
                  <tr key={c.id} data-testid={`cb-row-${c.id}`} className="border-t-2 border-[#E5E7EB] align-top">
                    <Td className="text-sm whitespace-nowrap">{new Date(c.created_at).toLocaleString("fr-FR")}</Td>
                    <Td>{c.first_name}</Td>
                    <Td>{c.contact}</Td>
                    <Td>{c.city}</Td>
                    <Td>{c.need}</Td>
                    <Td className="max-w-xs text-sm">{c.message || "—"}</Td>
                    <Td className="text-sm">{c.intervenant_name}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const Th = ({ children }) => <th className="p-3 text-left font-semibold text-[#1C1917]">{children}</th>;
const Td = ({ children, className = "" }) => <td className={`p-3 ${className}`}>{children}</td>;
