import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { MapPin, BadgeCheck, Home, Calendar, ArrowLeft, PhoneCall, Star } from "lucide-react";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function IntervenantDetail() {
  const { id } = useParams();
  const [i, setI] = useState(null);

  useEffect(() => {
    api.get(`/intervenants/${id}`).then(({ data }) => setI(data)).catch(() => setI(false));
  }, [id]);

  if (i === null) return <div className="max-w-4xl mx-auto p-8">Chargement…</div>;
  if (i === false) return <div className="max-w-4xl mx-auto p-8">Intervenant introuvable.</div>;

  const isPremium = i.plan === "premium" || i.subscription_status === "active";
  const av = i.availability || {};
  const week = (() => {
    if (!i.availability_week) return [];
    const base = new Date(i.availability_week);
    return Array.from({ length: 7 }).map((_, k) => {
      const d = new Date(base); d.setDate(d.getDate() + k);
      const iso = d.toISOString().slice(0, 10);
      return { iso, label: DAYS[k], slots: av[iso] || { morning: false, afternoon: false } };
    });
  })();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10" data-testid="intervenant-detail-page">
      <Link to="/patient" className="inline-flex items-center gap-2 text-[#2D6A4F] font-semibold mb-4" data-testid="back-btn">
        <ArrowLeft className="w-4 h-4" /> Retour aux résultats
      </Link>

      <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 md:p-10">
        <div className="flex flex-wrap gap-2 mb-3">
          {isPremium && (
            <span className="inline-flex items-center gap-1 bg-[#F8E7A1] border border-[#E0B84F] text-[#1C1917] text-sm font-semibold px-3 py-1 rounded-full">
              <Star className="w-4 h-4" /> Premium
            </span>
          )}
          {i.diploma_verified && (
            <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-sm font-semibold px-3 py-1 rounded-full">
              <BadgeCheck className="w-4 h-4" /> Diplôme vérifié
            </span>
          )}
          {i.available_today && (
            <span className="inline-flex items-center gap-1 bg-[#B85042] text-white text-sm font-semibold px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" /> Disponible aujourd'hui
            </span>
          )}
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">{i.first_name} {i.last_name}</h1>
        <div className="mt-2 flex items-center gap-2 text-[#4B5563] text-lg">
          <MapPin className="w-5 h-5" /> {i.city}{i.zone ? ` — ${i.zone}` : ""}
        </div>

        {i.bio && <p className="mt-5 text-[#1C1917] text-lg leading-relaxed">{i.bio}</p>}

        <div className="mt-6 grid md:grid-cols-2 gap-5">
          <InfoBlock title="Diplôme" value={i.diploma || "—"} />
          <InfoBlock title="Publics accompagnés" value={(i.publics || []).join(", ") || "—"} />
          <InfoBlock
            title="Lieux d'intervention"
            value={
              <div className="flex flex-wrap gap-2">
                {(i.intervention_places || []).map((p) => (
                  <span key={p} className="inline-flex items-center gap-1 bg-[#F9F8F6] border border-[#E5E7EB] px-3 py-1 rounded-full text-base capitalize">
                    {p === "domicile" && <Home className="w-4 h-4" />} {p}
                  </span>
                ))}
                {(i.intervention_places || []).length === 0 && "—"}
              </div>
            }
          />
          <InfoBlock title="Dernière mise à jour" value={i.last_availability_update ? new Date(i.last_availability_update).toLocaleString("fr-FR") : "—"} />
        </div>

        <div className="mt-8">
          <h2 className="font-heading font-bold text-xl text-[#1C1917] mb-3">Disponibilités cette semaine</h2>
          {i.available_this_week ? (
            <div className="overflow-x-auto">
              <table className="w-full text-base border-collapse" data-testid="availability-table">
                <thead>
                  <tr>
                    <th className="p-3 border-2 border-[#E5E7EB] bg-[#F9F8F6] text-left">Jour</th>
                    <th className="p-3 border-2 border-[#E5E7EB] bg-[#F9F8F6]">Matin</th>
                    <th className="p-3 border-2 border-[#E5E7EB] bg-[#F9F8F6]">Après-midi</th>
                  </tr>
                </thead>
                <tbody>
                  {week.map((d) => (
                    <tr key={d.iso}>
                      <td className="p-3 border-2 border-[#E5E7EB] font-semibold">{d.label}</td>
                      <td className={`p-3 border-2 border-[#E5E7EB] text-center ${d.slots.morning ? "bg-[#2D6A4F] text-white font-semibold" : ""}`}>{d.slots.morning ? "✓" : "—"}</td>
                      <td className={`p-3 border-2 border-[#E5E7EB] text-center ${d.slots.afternoon ? "bg-[#2D6A4F] text-white font-semibold" : ""}`}>{d.slots.afternoon ? "✓" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[#4B5563]">Cet intervenant n'a pas confirmé ses disponibilités cette semaine.</p>
          )}
          <p className="mt-3 text-sm italic text-[#4B5563]">
            Disponibilités déclarées par l'intervenant, à confirmer lors de la prise de contact.
          </p>
        </div>

        <Link
          to={`/patient/callback/${i.id}`}
          data-testid="callback-btn"
          className="mt-8 inline-flex items-center justify-center gap-2 w-full md:w-auto bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-lg px-8 py-4 rounded-2xl"
        >
          <PhoneCall className="w-5 h-5" /> Demander un rappel
        </Link>
      </div>
    </div>
  );
}

function InfoBlock({ title, value }) {
  return (
    <div className="bg-[#F9F8F6] border border-[#E5E7EB] rounded-xl p-4">
      <div className="text-sm font-semibold text-[#4B5563] uppercase tracking-wide">{title}</div>
      <div className="mt-1 text-[#1C1917] text-lg">{value}</div>
    </div>
  );
}
