export const PLACE_LABELS = {
  domicile: "À domicile",
  cabinet: "En cabinet",
  salle: "En structure",
  exterieur: "En extérieur",
  visioconference: "En visioconférence",
};

export const AVAILABILITY_LABELS = {
  available: { label: "Disponible actuellement", className: "bg-[#DFF3E5] text-[#1B6338]" },
  waitlist: { label: "Liste d'attente", className: "bg-[#FFF3CD] text-[#765600]" },
  unavailable: { label: "Indisponible", className: "bg-[#F1F2F3] text-[#4B5563]" },
};

export function availabilityState(intervenant) {
  const confirmedAt = intervenant.availability_confirmed_at
    ? new Date(intervenant.availability_confirmed_at).getTime()
    : 0;
  const recentlyConfirmed = intervenant.availability_recent === true
    || (intervenant.availability_recent === undefined && (
      intervenant.available_this_week
      || (confirmedAt > 0 && Date.now() - confirmedAt <= 8 * 24 * 60 * 60 * 1000)
    ));
  if (!recentlyConfirmed) {
    return {
      label: "Disponibilité non confirmée récemment",
      className: "bg-[#FDE8E5] text-[#8F392F]",
      stale: true,
    };
  }
  return AVAILABILITY_LABELS[intervenant.availability_status] || AVAILABILITY_LABELS.unavailable;
}

export function waitLabel(days) {
  if (days === null || days === undefined || days === "") return "";
  const value = Number(days);
  if (value === 0) return "Premier rendez-vous possible rapidement";
  if (value <= 7) return "Délai estimé : moins d'une semaine";
  return `Délai estimé : environ ${Math.ceil(value / 7)} semaine${value > 7 ? "s" : ""}`;
}
