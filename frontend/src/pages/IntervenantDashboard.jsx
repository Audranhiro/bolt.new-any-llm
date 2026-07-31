import { useEffect, useState } from "react";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";
import { Check, X, Save, Phone, Mail, Inbox } from "lucide-react";
import MyClassesSection from "@/components/MyClassesSection";
import MyVideosSection from "@/components/MyVideosSection";

const PUBLICS = ["Seniors", "Adultes", "Enfants", "Maladies chroniques", "Oncologie", "Diabète", "Obésité", "Réhabilitation cardiaque", "Parkinson", "Alzheimer"];
const PLACES = [
  { key: "domicile", label: "À domicile" },
  { key: "cabinet", label: "Cabinet" },
  { key: "salle", label: "Salle de sport" },
  { key: "exterieur", label: "Extérieur" },
  { key: "visioconference", label: "Visioconférence" },
];
const EXPERIENCE_DOMAINS = ["Reprise progressive", "Maintien de l'autonomie", "Prévention des chutes", "Activité sur chaise", "Lutte contre la sédentarité"];
const ACCOMPANIMENT_TYPES = ["Remise en mouvement", "Renforcement adapté", "Mobilité et équilibre", "Endurance adaptée"];
const FORMATS = ["Individuel", "Collectif"];
const PAYMENT_METHODS = ["Carte bancaire", "Chèque", "Espèces", "Virement", "Aide financière déclarée"];
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
  function toggleList(field, value) {
    const values = profile[field] || [];
    setField(field, values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
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
        photo_url: profile.photo_url || "",
        intervention_radius_km: profile.intervention_radius_km ?? null,
        experience_years: profile.experience_years ?? null,
        experience_domains: profile.experience_domains || [],
        accompaniment_types: profile.accompaniment_types || [],
        accompaniment_formats: profile.accompaniment_formats || [],
        indicative_rate: profile.indicative_rate || "",
        payment_methods: profile.payment_methods || [],
        estimated_wait_days: profile.estimated_wait_days ?? null,
        habitual_slots: profile.habitual_slots || [],
        individual_places_available: profile.individual_places_available ?? null,
        collective_places_available: profile.collective_places_available ?? null,
        availability_status: profile.availability_status || (profile.availability_week === week ? "available" : "unavailable"),
      };
      const { data } = await api.put("/intervenants/me", payload);
      setProfile(data);
      setMsg("Profil mis à jour.");
    } catch (e) { setErr(formatApiError(e)); } finally { setSaving(false); }
  }

  async function confirmAvailability() {
    setSaving(true); setMsg(""); setErr("");
    try {
      const { data } = await api.post("/intervenants/me/availability", {
        availability: profile.availability || {},
        availability_status: profile.availability_status || "available",
        estimated_wait_days: profile.estimated_wait_days ?? null,
        individual_places_available: profile.individual_places_available ?? null,
        collective_places_available: profile.collective_places_available ?? null,
      });
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
          <Labeled label="Rayon d'intervention (km)"><input type="number" min="0" max="250" className={inputCls} value={profile.intervention_radius_km ?? ""} onChange={(e) => setField("intervention_radius_km", e.target.value ? Number(e.target.value) : null)} /></Labeled>
          <Labeled label="Diplôme"><input data-testid="prof-diploma" className={inputCls} value={profile.diploma || ""} onChange={(e) => setField("diploma", e.target.value)} /></Labeled>
          <Labeled label="Années d'expérience déclarées"><input type="number" min="0" max="70" className={inputCls} value={profile.experience_years ?? ""} onChange={(e) => setField("experience_years", e.target.value ? Number(e.target.value) : null)} /></Labeled>
          <Labeled label="Téléphone"><input data-testid="prof-phone" className={inputCls} value={profile.phone || ""} onChange={(e) => setField("phone", e.target.value)} /></Labeled>
          <Labeled label="Tarifs indicatifs"><input className={inputCls} placeholder="Ex. 45 € la séance, sur devis" value={profile.indicative_rate || ""} onChange={(e) => setField("indicative_rate", e.target.value)} /></Labeled>
          <Labeled label="URL de la photo professionnelle"><input type="url" className={inputCls} placeholder="https://..." value={profile.photo_url || ""} onChange={(e) => setField("photo_url", e.target.value)} /></Labeled>
          <Labeled label="Créneaux habituels"><input className={inputCls} placeholder="Ex. mardi matin, jeudi après-midi" value={(profile.habitual_slots || []).join(", ")} onChange={(e) => setField("habitual_slots", e.target.value.split(",").map((value) => value.trim()).filter(Boolean))} /></Labeled>
          <Labeled label="Latitude"><input data-testid="prof-lat" type="number" step="0.0001" className={inputCls} value={profile.lat ?? ""} onChange={(e) => setField("lat", e.target.value ? parseFloat(e.target.value) : null)} /></Labeled>
          <Labeled label="Longitude"><input data-testid="prof-lng" type="number" step="0.0001" className={inputCls} value={profile.lng ?? ""} onChange={(e) => setField("lng", e.target.value ? parseFloat(e.target.value) : null)} /></Labeled>
        </div>

        <ChoiceGroup title="Domaines d'expérience déclarés" values={EXPERIENCE_DOMAINS} selected={profile.experience_domains || []} onToggle={(value) => toggleList("experience_domains", value)} />
        <ChoiceGroup title="Types d'accompagnement" values={ACCOMPANIMENT_TYPES} selected={profile.accompaniment_types || []} onToggle={(value) => toggleList("accompaniment_types", value)} />
        <ChoiceGroup title="Formats" values={FORMATS} selected={profile.accompaniment_formats || []} onToggle={(value) => toggleList("accompaniment_formats", value)} />
        <ChoiceGroup title="Moyens de paiement ou financements déclarés" values={PAYMENT_METHODS} selected={profile.payment_methods || []} onToggle={(value) => toggleList("payment_methods", value)} />
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

        <div className="mt-5 grid md:grid-cols-4 gap-4">
          <Labeled label="Statut">
            <select className={inputCls} value={profile.availability_status || "unavailable"} onChange={(e) => setField("availability_status", e.target.value)}>
              <option value="available">Disponible actuellement</option>
              <option value="waitlist">Liste d'attente</option>
              <option value="unavailable">Indisponible</option>
            </select>
          </Labeled>
          <Labeled label="Délai estimé (jours)"><input type="number" min="0" className={inputCls} value={profile.estimated_wait_days ?? ""} onChange={(e) => setField("estimated_wait_days", e.target.value ? Number(e.target.value) : null)} /></Labeled>
          <Labeled label="Places individuelles"><input type="number" min="0" className={inputCls} value={profile.individual_places_available ?? ""} onChange={(e) => setField("individual_places_available", e.target.value ? Number(e.target.value) : null)} /></Labeled>
          <Labeled label="Places collectives"><input type="number" min="0" className={inputCls} value={profile.collective_places_available ?? ""} onChange={(e) => setField("collective_places_available", e.target.value ? Number(e.target.value) : null)} /></Labeled>
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

      <MyClassesSection />
      <MyVideosSection />
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

function ChoiceGroup({ title, values, selected, onToggle }) {
  return (
    <div className="mt-5">
      <div className="text-base font-semibold mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <button key={value} type="button" aria-pressed={selected.includes(value)} onClick={() => onToggle(value)} className={`px-4 py-2 rounded-full border-2 text-base ${selected.includes(value) ? "bg-[#2D6A4F] text-white border-[#2D6A4F]" : "bg-white border-[#E5E7EB]"}`}>
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
