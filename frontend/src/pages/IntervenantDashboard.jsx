import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Check, X, Save, Phone, Mail, Inbox } from "lucide-react";

const PUBLICS = ["Seniors", "Adultes", "Enfants", "Maladies chroniques", "Oncologie", "Diabète", "Obésité", "Réhabilitation cardiaque", "Parkinson", "Alzheimer"];
const PLACES = [
  { key: "domicile", label: "À domicile" },
  { key: "cabinet", label: "Cabinet" },
  { key: "salle", label: "Salle de sport" },
  { key: "exterieur", label: "Extérieur" },
];
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function mondayIso() {
  const d = new Date();
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.toISOString().slice(0, 10);
}

export default function IntervenantDashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [callbacks, setCallbacks] = useState([]);

  useEffect(() => {
    if (user && user.role === "intervenant") {
      api.get("/intervenants/me").then(({ data }) => setProfile(data));
      api.get("/intervenants/me/callbacks").then(({ data }) => setCallbacks(data)).catch(() => {});
    }
  }, [user]);

  async function changeStatus(id, status) {
    try {
      await api.patch(`/intervenants/me/callbacks/${id}/status`, { status });
      setCallbacks((cs) => cs.map((c) => c.id === id ? { ...c, status } : c));
    } catch (e) {
      setErr(formatApiError(e));
    }
  }

  if (user === null) return <div className="p-8">Chargement…</div>;
  if (!user || user.role !== "intervenant") return <Navigate to="/intervenant/login" />;
  if (!profile) return <div className="p-8">Chargement du profil…</div>;

  const week = mondayIso();
  const weekDates = Array.from({ length: 7 }).map((_, k) => {
    const base = new Date(week); base.setDate(base.getDate() + k);
    return base.toISOString().slice(0, 10);
  });

  function setField(k, v) { setProfile((p) => ({ ...p, [k]: v })); }
  function togglePublic(p) {
    const has = profile.publics.includes(p);
    setField("publics", has ? profile.publics.filter((x) => x !== p) : [...profile.publics, p]);
  }
  function togglePlace(p) {
    const has = profile.intervention_places.includes(p);
    setField("intervention_places", has ? profile.intervention_places.filter((x) => x !== p) : [...profile.intervention_places, p]);
  }
  function toggleSlot(date, slot) {
    const av = { ...(profile.availability || {}) };
    const cur = av[date] || { morning: false, afternoon: false };
    av[date] = { ...cur, [slot]: !cur[slot] };
    if (!av[date].morning && !av[date].afternoon) delete av[date];
    setField("availability", av);
  }

  async function saveProfile() {
    setSaving(true); setMsg(""); setErr("");
    try {
      const payload = {
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        city: profile.city || "",
        zone: profile.zone || "",
        diploma: profile.diploma || "",
        publics: profile.publics || [],
        intervention_places: profile.intervention_places || [],
        phone: profile.phone || "",
        bio: profile.bio || "",
        lat: profile.lat || null,
        lng: profile.lng || null,
      };
      const { data } = await api.put("/intervenants/me", payload);
      setProfile(data);
      setMsg("Profil mis à jour.");
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  async function confirmAvailability() {
    setSaving(true); setMsg(""); setErr("");
    try {
      const { data } = await api.post("/intervenants/me/availability", { availability: profile.availability || {} });
      setProfile(data);
      setMsg("Disponibilités confirmées pour cette semaine.");
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  async function keepSame() {
    setSaving(true); setMsg(""); setErr("");
    try {
      const { data } = await api.post("/intervenants/me/keep-availability");
      setProfile(data);
      setMsg("Mêmes disponibilités conservées.");
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  async function markUnavailable() {
    setSaving(true); setMsg(""); setErr("");
    try {
      const { data } = await api.post("/intervenants/me/unavailable");
      setProfile(data);
      setMsg("Vous êtes marqué(e) comme indisponible cette semaine.");
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  const confirmed = profile.availability_week === week;

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 md:py-10 space-y-6" data-testid="intervenant-dashboard">
      <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">Mon espace intervenant</h1>
      <p className="text-[#4B5563] text-lg">Bonjour {profile.first_name}, gérez votre profil et vos disponibilités.</p>

      {/* Profile */}
      <section className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6">
        <h2 className="font-heading font-bold text-2xl mb-4">Mon profil</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Labeled label="Prénom"><input data-testid="prof-first-name" className={inputCls} value={profile.first_name || ""} onChange={(e) => setField("first_name", e.target.value)} /></Labeled>
          <Labeled label="Nom"><input data-testid="prof-last-name" className={inputCls} value={profile.last_name || ""} onChange={(e) => setField("last_name", e.target.value)} /></Labeled>
          <Labeled label="Ville"><input data-testid="prof-city" className={inputCls} value={profile.city || ""} onChange={(e) => setField("city", e.target.value)} /></Labeled>
          <Labeled label="Zone d'intervention"><input data-testid="prof-zone" className={inputCls} value={profile.zone || ""} onChange={(e) => setField("zone", e.target.value)} /></Labeled>
          <Labeled label="Diplôme"><input data-testid="prof-diploma" className={inputCls} value={profile.diploma || ""} onChange={(e) => setField("diploma", e.target.value)} /></Labeled>
          <Labeled label="Téléphone"><input data-testid="prof-phone" className={inputCls} value={profile.phone || ""} onChange={(e) => setField("phone", e.target.value)} /></Labeled>
          <Labeled label="Latitude"><input data-testid="prof-lat" type="number" step="0.0001" className={inputCls} value={profile.lat ?? ""} onChange={(e) => setField("lat", e.target.value ? parseFloat(e.target.value) : null)} /></Labeled>
          <Labeled label="Longitude"><input data-testid="prof-lng" type="number" step="0.0001" className={inputCls} value={profile.lng ?? ""} onChange={(e) => setField("lng", e.target.value ? parseFloat(e.target.value) : null)} /></Labeled>
        </div>
        <Labeled label="Présentation" className="mt-4">
          <textarea rows={3} className={`${inputCls} py-3`} data-testid="prof-bio" value={profile.bio || ""} onChange={(e) => setField("bio", e.target.value)} />
        </Labeled>

        <div className="mt-5">
          <div className="text-base font-semibold mb-2">Publics accompagnés</div>
          <div className="flex flex-wrap gap-2">
            {PUBLICS.map((p) => (
              <button key={p} type="button" onClick={() => togglePublic(p)} data-testid={`prof-public-${p}`}
                className={`px-4 py-2 rounded-full border-2 text-base ${profile.publics.includes(p) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white border-[#E5E7EB]"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-base font-semibold mb-2">Lieux d'intervention</div>
          <div className="flex flex-wrap gap-2">
            {PLACES.map((p) => (
              <button key={p.key} type="button" onClick={() => togglePlace(p.key)} data-testid={`prof-place-${p.key}`}
                className={`px-4 py-2 rounded-full border-2 text-base ${profile.intervention_places.includes(p.key) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white border-[#E5E7EB]"}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <button onClick={saveProfile} disabled={saving} data-testid="prof-save-btn" className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-2xl font-semibold text-lg">
          <Save className="w-5 h-5" /> Enregistrer mon profil
        </button>
      </section>

      {/* Availability */}
      <section className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-heading font-bold text-2xl">Mes disponibilités cette semaine</h2>
            <p className="text-[#4B5563]">
              {confirmed
                ? `Confirmées le ${new Date(profile.availability_confirmed_at).toLocaleString("fr-FR")}`
                : "Non confirmées pour cette semaine"}
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${confirmed ? "bg-[#2D6A4F] text-white" : "bg-[#B85042] text-white"}`} data-testid="availability-status">
            {confirmed ? <><Check className="w-4 h-4" /> Actif</> : <><X className="w-4 h-4" /> Non visible</>}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr>
                <th className="p-3 text-left bg-[#F9F8F6] border-2 border-[#E5E7EB]">Jour</th>
                <th className="p-3 bg-[#F9F8F6] border-2 border-[#E5E7EB]">Matin</th>
                <th className="p-3 bg-[#F9F8F6] border-2 border-[#E5E7EB]">Après-midi</th>
              </tr>
            </thead>
            <tbody>
              {weekDates.map((date, i) => {
                const slots = (profile.availability || {})[date] || { morning: false, afternoon: false };
                return (
                  <tr key={date}>
                    <td className="p-3 border-2 border-[#E5E7EB] font-semibold">{DAYS[i]} <span className="text-[#4B5563] font-normal text-sm">({date})</span></td>
                    {["morning", "afternoon"].map((s) => (
                      <td key={s} className="p-2 border-2 border-[#E5E7EB] text-center">
                        <button type="button" onClick={() => toggleSlot(date, s)} data-testid={`slot-${date}-${s}`}
                          className={`w-full min-h-[48px] rounded-xl font-semibold text-base ${slots[s] ? "bg-[#2D6A4F] text-white" : "bg-[#F9F8F6] text-[#4B5563] hover:bg-[#E5E7EB]"}`}>
                          {slots[s] ? "Disponible" : "—"}
                        </button>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={confirmAvailability} disabled={saving} data-testid="av-confirm-btn" className="min-h-[56px] px-6 bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-2xl font-semibold text-lg">Confirmer mes disponibilités cette semaine</button>
          <button onClick={keepSame} disabled={saving} data-testid="av-keep-btn" className="min-h-[56px] px-6 bg-white border-2 border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#F9F8F6] rounded-2xl font-semibold text-lg">Garder les mêmes disponibilités</button>
          <button onClick={markUnavailable} disabled={saving} data-testid="av-unavail-btn" className="min-h-[56px] px-6 bg-[#B85042] hover:opacity-90 text-white rounded-2xl font-semibold text-lg">Indisponible cette semaine</button>
        </div>

        {msg && <div className="mt-4 text-[#2D6A4F] font-semibold" data-testid="save-msg">{msg}</div>}
        {err && <div className="mt-4 text-[#B85042] font-semibold" data-testid="save-err">{err}</div>}

        <p className="mt-4 text-sm italic text-[#4B5563]">
          Disponibilités déclarées par l'intervenant, à confirmer lors de la prise de contact.
        </p>
      </section>

      {/* Mes demandes de rappel */}
      <section className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6" data-testid="my-callbacks-section">
        <div className="flex items-center gap-3 mb-4">
          <Inbox className="w-6 h-6 text-[#2D6A4F]" />
          <h2 className="font-heading font-bold text-2xl">Mes demandes de rappel ({callbacks.length})</h2>
        </div>

        {callbacks.length === 0 && (
          <div className="bg-[#F9F8F6] border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-[#4B5563]" data-testid="my-callbacks-empty">
            Aucune demande de rappel pour le moment.
          </div>
        )}

        <div className="space-y-4">
          {callbacks.map((c) => (
            <article key={c.id} data-testid={`my-cb-${c.id}`} className="border-2 border-[#E5E7EB] rounded-xl p-4 md:p-5">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-heading font-bold text-xl text-[#1C1917]">{c.first_name}</h3>
                    <StatusBadge status={c.status} />
                    <span className="text-sm text-[#4B5563]">{new Date(c.created_at).toLocaleString("fr-FR")}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-base">
                    {c.phone && (
                      <a href={`tel:${c.phone}`} className="inline-flex items-center gap-2 text-[#1C1917] hover:text-[#2D6A4F]">
                        <Phone className="w-4 h-4" /> <span className="font-semibold">{c.phone}</span>
                      </a>
                    )}
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="inline-flex items-center gap-2 text-[#1C1917] hover:text-[#2D6A4F]">
                        <Mail className="w-4 h-4" /> <span className="font-semibold">{c.email}</span>
                      </a>
                    )}
                  </div>
                  {c.city && <div className="mt-1 text-sm text-[#4B5563]">Ville : {c.city}</div>}
                  {c.need && <div className="mt-1 text-sm text-[#4B5563]">Besoin : {c.need}</div>}
                  {c.message && (
                    <div className="mt-3 bg-[#F9F8F6] border border-[#E5E7EB] rounded-lg p-3 text-[#1C1917]">
                      {c.message}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 min-w-[200px]">
                  <label className="text-sm font-semibold text-[#4B5563]">Statut</label>
                  <select
                    data-testid={`my-cb-status-${c.id}`}
                    value={c.status}
                    onChange={(e) => changeStatus(c.id, e.target.value)}
                    className="min-h-[48px] px-3 text-base rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white"
                  >
                    <option value="new">Nouvelle</option>
                    <option value="contacted">Contacté</option>
                    <option value="closed">Clôturée</option>
                  </select>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    new: { label: "Nouvelle", cls: "bg-[#B85042] text-white" },
    contacted: { label: "Contacté", cls: "bg-[#74A57F] text-white" },
    closed: { label: "Clôturée", cls: "bg-[#4B5563] text-white" },
  };
  const s = map[status] || map.new;
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${s.cls}`}>{s.label}</span>;
}

const inputCls = "w-full min-h-[56px] px-4 text-lg rounded-xl border-2 border-[#E5E7EB] focus:border-[#2D6A4F] outline-none bg-white";

function Labeled({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-base font-semibold text-[#1C1917] mb-2">{label}</div>
      {children}
    </label>
  );
}
