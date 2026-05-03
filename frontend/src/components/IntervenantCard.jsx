import { Link } from "react-router-dom";
import { MapPin, BadgeCheck, Home, Calendar, ChevronRight, Star } from "lucide-react";

export default function IntervenantCard({ i }) {
  const hasHome = (i.intervention_places || []).includes("domicile");
  const isPremium = i.plan === "premium" || i.subscription_status === "active";
  return (
    <article
      className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 md:p-6 hover:border-[#2D6A4F] transition-colors"
      data-testid={`intervenant-card-${i.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading text-xl md:text-2xl font-bold text-[#1C1917]">
              {i.first_name} {i.last_name}
            </h3>
            {isPremium && (
              <span className="inline-flex items-center gap-1 bg-[#F8E7A1] border border-[#E0B84F] text-[#1C1917] text-sm font-semibold px-3 py-1 rounded-full">
                <Star className="w-4 h-4" /> Premium
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[#4B5563]">
            <MapPin className="w-4 h-4" />
            <span className="text-base">{i.city}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {i.diploma_verified && (
              <span className="inline-flex items-center gap-1 bg-[#2D6A4F] text-white text-sm font-semibold px-3 py-1 rounded-full">
                <BadgeCheck className="w-4 h-4" /> Diplôme vérifié
              </span>
            )}
            {i.available_today && (
              <span className="inline-flex items-center gap-1 bg-[#B85042] text-white text-sm font-semibold px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" /> Aujourd'hui
              </span>
            )}
            {i.available_this_week && !i.available_today && (
              <span className="inline-flex items-center gap-1 bg-[#74A57F] text-white text-sm font-semibold px-3 py-1 rounded-full">
                <Calendar className="w-4 h-4" /> Cette semaine
              </span>
            )}
            {hasHome && (
              <span className="inline-flex items-center gap-1 bg-[#F9F8F6] border border-[#E5E7EB] text-[#1C1917] text-sm font-semibold px-3 py-1 rounded-full">
                <Home className="w-4 h-4" /> Domicile
              </span>
            )}
          </div>
          {i.publics && i.publics.length > 0 && (
            <p className="mt-3 text-[#4B5563] text-base">
              <span className="font-semibold text-[#1C1917]">Publics :</span> {i.publics.join(", ")}
            </p>
          )}
        </div>
        <Link
          to={`/patient/intervenant/${i.id}`}
          data-testid={`intervenant-card-view-${i.id}`}
          className="shrink-0 inline-flex items-center gap-1 bg-[#2D6A4F] hover:bg-[#1B4332] text-white font-semibold px-4 py-3 rounded-2xl text-base"
        >
          Voir <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </article>
  );
}
