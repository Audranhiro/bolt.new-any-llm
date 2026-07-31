import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { MapPin, BadgeCheck, Home, Calendar, ArrowLeft, PhoneCall, Video, ExternalLink, Armchair, Clock3, Users } from "lucide-react";
import { availabilityState, PLACE_LABELS, waitLabel } from "@/lib/intervenant";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

export default function IntervenantDetail() {
  const { id } = useParams();
  const [i, setI] = useState(null);
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    api.get(`/intervenants/${id}`)
        .then(({ data }) => setI(data))
            .catch(() => setI(false));

              api.get("/videos")
                  .then(({ data }) => {
                        const filtered = data.filter((v) => v.intervenant_id === id);
                              setVideos(filtered);
                                  })
                                      .catch(() => setVideos([]));
                                      }, [id]);

  if (i === null) return <div className="max-w-4xl mx-auto p-8">Chargement…</div>;
  if (i === false) return <div className="max-w-4xl mx-auto p-8">Intervenant introuvable.</div>;

  const av = i.availability || {};
  const availability = availabilityState(i);
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
          <span className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full ${availability.className}`}>
            <Calendar className="w-4 h-4" /> {availability.label}
          </span>
          {i.diploma_verified && (
            <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-sm font-semibold px-3 py-1 rounded-full">
              <BadgeCheck className="w-4 h-4" /> Diplôme vérifié
            </span>
          )}
          {!availability.stale && i.available_today && (
            <span className="inline-flex items-center gap-1 bg-[#B85042] text-white text-sm font-semibold px-3 py-1 rounded-full">
              <Calendar className="w-4 h-4" /> Disponible aujourd'hui
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {i.photo_url ? (
            <img src={i.photo_url} alt={`Portrait professionnel de ${i.first_name} ${i.last_name}`} loading="lazy" className="h-20 w-20 rounded-2xl object-cover border-2 border-[#E5E7EB]" />
          ) : (
            <div className="h-20 w-20 rounded-2xl bg-[#EDF4EF] text-[#2D6A4F] flex items-center justify-center text-2xl font-heading font-bold" aria-hidden="true">
              {(i.first_name?.[0] || "")}{(i.last_name?.[0] || "")}
            </div>
          )}
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-[#1C1917]">{i.first_name} {i.last_name}</h1>
        </div>
        <div className="mt-2 flex items-center gap-2 text-[#4B5563] text-lg">
          <MapPin className="w-5 h-5" /> {i.city}{i.zone ? ` — ${i.zone}` : ""}{i.intervention_radius_km ? ` · rayon de ${i.intervention_radius_km} km` : ""}
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
                    {p === "domicile" && <Home className="w-4 h-4" />} {PLACE_LABELS[p] || p}
                  </span>
                ))}
                {(i.intervention_places || []).length === 0 && "—"}
              </div>
            }
          />
          <InfoBlock title="Dernière mise à jour" value={i.last_availability_update ? new Date(i.last_availability_update).toLocaleString("fr-FR") : "—"} />
          <InfoBlock title="Domaines d'expérience déclarés" value={(i.experience_domains || []).join(", ") || "—"} />
          <InfoBlock title="Expérience déclarée" value={i.experience_years !== null && i.experience_years !== undefined ? `${i.experience_years} an(s)` : "—"} />
          <InfoBlock title="Types d'accompagnement" value={(i.accompaniment_types || []).join(", ") || "—"} />
          <InfoBlock title="Format" value={(i.accompaniment_formats || []).join(", ") || "—"} />
          <InfoBlock title="Créneaux habituels" value={(i.habitual_slots || []).join(", ") || "Non renseignés"} />
          <InfoBlock title="Tarifs indicatifs" value={i.indicative_rate || "Non renseignés"} />
          <InfoBlock title="Paiements ou financements déclarés" value={(i.payment_methods || []).join(", ") || "Non renseignés"} />
        </div>

        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <Summary icon={<Clock3 className="w-5 h-5" />} title="Délai estimé" value={waitLabel(i.estimated_wait_days) || "Non renseigné"} />
          <Summary icon={<Users className="w-5 h-5" />} title="Places individuelles" value={i.individual_places_available ?? "Non renseigné"} />
          <Summary icon={<Users className="w-5 h-5" />} title="Places collectives" value={i.collective_places_available ?? "Non renseigné"} />
        </div>

        {/* Availability grid */}
        <div className="mt-8">
          <h2 className="font-heading font-bold text-xl text-[#1C1917] mb-3">Disponibilités cette semaine</h2>
          {!availability.stale && i.available_this_week ? (
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
            <p className={`rounded-xl p-4 font-semibold ${availability.className}`}>{availability.label}</p>
          )}
          <p className="mt-3 text-sm italic text-[#4B5563]">
            Disponibilités déclarées par l'intervenant, à confirmer lors de la prise de contact.
          </p>
        </div>

{/* Videos APA */}
<div className="mt-8">
  <div className="flex items-center gap-3 mb-4">
      <Video className="w-6 h-6 text-[#2D6A4F]" />
          <h2 className="font-heading font-bold text-xl text-[#1C1917]">
                Vidéos APA de l'intervenant
                    </h2>
                      </div>

                        {videos.length === 0 ? (
                            <div className="bg-[#F9F8F6] border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 text-center text-[#4B5563]">
                                  Aucune vidéo APA publiée pour le moment.
                                      </div>
                                        ) : (
                                            <div className="grid md:grid-cols-2 gap-4">
                                                  {videos.map((v) => (
                                                          <article
                                                                    key={v.id}
                                                                              className="bg-[#F9F8F6] border-2 border-[#E5E7EB] rounded-xl p-4"
                                                                                      >
                                                                                                <div className="flex items-start justify-between gap-2">
                                                                                                            <h3 className="font-heading font-bold text-lg text-[#1C1917]">
                                                                                                                          {v.title}
                                                                                                                                      </h3>

                                                                                                                                                  {v.adapted_chair_video && (
                                                                                                                                                                <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-xs font-semibold px-2 py-1 rounded-full">
                                                                                                                                                                                <Armchair className="w-3 h-3" /> Chaise
                                                                                                                                                                                              </span>
                                                                                                                                                                                                          )}
                                                                                                                                                                                                                    </div>

                                                                                                                                                                                                                              {v.description && (
                                                                                                                                                                                                                                          <p className="mt-2 text-sm text-[#4B5563]">
                                                                                                                                                                                                                                                        {v.description}
                                                                                                                                                                                                                                                                    </p>
                                                                                                                                                                                                                                                                              )}

                                                                                                                                                                                                                                                                                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                                                                                                                                                                                                                                                                                    {v.duration_minutes > 0 && (
                                                                                                                                                                                                                                                                                                                  <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded-full">
                                                                                                                                                                                                                                                                                                                                  {v.duration_minutes} min
                                                                                                                                                                                                                                                                                                                                                </span>
                                                                                                                                                                                                                                                                                                                                                            )}

                                                                                                                                                                                                                                                                                                                                                                        {v.level && (
                                                                                                                                                                                                                                                                                                                                                                                      <span className="bg-white border border-[#E5E7EB] px-2 py-1 rounded-full">
                                                                                                                                                                                                                                                                                                                                                                                                      {v.level}
                                                                                                                                                                                                                                                                                                                                                                                                                    </span>
                                                                                                                                                                                                                                                                                                                                                                                                                                )}

                                                                                                                                                                                                                                                                                                                                                                                                                                            <span
                                                                                                                                                                                                                                                                                                                                                                                                                                                          className={`px-2 py-1 rounded-full font-semibold ${
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          v.access_level === "premium"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ? "bg-[#B85042] text-white"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              : "bg-[#74A57F] text-white"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }`}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {v.access_level === "premium" ? "Premium" : "Gratuit"}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      {v.video_url && (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <a
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                href={v.video_url}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              target="_blank"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            rel="noopener noreferrer"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          className="mt-4 inline-flex items-center justify-center gap-2 w-full bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-4 py-3 rounded-xl"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <ExternalLink className="w-4 h-4" />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  Voir la vidéo
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </a>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </article>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      ))}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            )}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/patient/callback/${i.id}`}
            data-testid="callback-btn"
            className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold text-lg px-8 py-4 rounded-2xl"
          >
            <PhoneCall className="w-5 h-5" /> Demander un rappel
          </Link>
          <button type="button" disabled className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl border-2 border-[#BFC9C2] bg-[#F1F2F3] text-[#6B7280] font-semibold cursor-not-allowed" title="Le parcours d'orientation sera activé après validation des comptes organisations">
            Orienter un patient — bientôt disponible
          </button>
        </div>
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

function Summary({ icon, title, value }) {
  return (
    <div className="rounded-xl bg-[#EDF4EF] p-4">
      <div className="text-[#2D6A4F]">{icon}</div>
      <div className="mt-2 text-sm font-semibold text-[#4B5563]">{title}</div>
      <div className="mt-1 font-bold text-[#1C1917]">{value}</div>
    </div>
  );
}
