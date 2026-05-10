export const CLASS_CATEGORIES = [
  { key: "cours_sur_chaise", label: "Cours sur chaise" },
  { key: "mobilite_douce", label: "Mobilité douce" },
  { key: "prevention_chutes", label: "Prévention des chutes" },
  { key: "renforcement_doux", label: "Renforcement doux" },
  { key: "respiration_relaxation", label: "Respiration & relaxation" },
  { key: "equilibre", label: "Équilibre" },
  { key: "autre", label: "Autre" },
];

export const CLASS_PUBLICS = [
  { key: "seniors", label: "Seniors" },
  { key: "debutants", label: "Débutants" },
  { key: "personnes_deconditionnees", label: "Personnes déconditionnées" },
  { key: "douleurs_chroniques", label: "Douleurs chroniques" },
  { key: "retour_activite", label: "Retour à l'activité" },
  { key: "autre", label: "Autre" },
];

export const VIDEO_CATEGORIES = [
  { key: "exercices_sur_chaise", label: "Exercices sur chaise" },
  { key: "mobilite", label: "Mobilité" },
  { key: "renforcement_doux", label: "Renforcement doux" },
  { key: "respiration", label: "Respiration" },
  { key: "equilibre", label: "Équilibre" },
  { key: "relaxation", label: "Relaxation" },
  { key: "autre", label: "Autre" },
];

export const VIDEO_LEVELS = [
  { key: "debutant", label: "Débutant" },
  { key: "intermediaire", label: "Intermédiaire" },
  { key: "avance", label: "Avancé" },
];

export const STRUCTURE_TYPES = [
  { key: "association", label: "Association" },
  { key: "maison_sport_sante", label: "Maison Sport-Santé" },
  { key: "residence_senior", label: "Résidence senior" },
  { key: "mairie", label: "Mairie / Service municipal" },
  { key: "club", label: "Club" },
  { key: "centre_social", label: "Centre social" },
  { key: "autre", label: "Autre" },
];

export function labelFromKey(list, key) {
  return (list.find((x) => x.key === key) || {}).label || key;
}
