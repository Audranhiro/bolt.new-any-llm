# APA Connect — Product Requirements (PRD)

## Original problem statement
Application web mobile responsive pour mettre en relation patients et intervenants APA (Activité Physique Adaptée). Inclut page d'accueil à 2 boutons, recherche patient (ville + carte + liste + filtres), fiche intervenant, formulaire de rappel, dashboard intervenant (profil + disponibilités par demi-journée), dashboard admin (validation diplôme, masquage, demandes de rappel). 5 faux intervenants autour de Rouen.

## User choices (3 Feb 2026)
- Auth: JWT email/password
- Carte: Leaflet + OpenStreetMap
- Admin pré-seeded
- Pas d'email, stockage DB uniquement
- Langue: français

## Architecture
- Backend: FastAPI + Motor/MongoDB, JWT + bcrypt
- Frontend: React 19 + React Router 7, Tailwind, Leaflet
- Design: Organic & Earthy light theme (#2D6A4F), Work Sans + Manrope, senior-friendly (min-h-56px CTAs)

## Implemented (3 Feb 2026)
- Auth: register/login/logout/me with cookie + localStorage Bearer fallback
- Public APIs: list intervenants with filters (city/available_today/available_week/home/verified), detail, callback creation
- Intervenant APIs: get/update self, set availability, keep same, mark unavailable
- Admin APIs: list all, validate diploma, toggle hidden, list callbacks
- Frontend pages: Home, PatientSearch (map+list), IntervenantDetail, CallbackForm, Login, Register, IntervenantDashboard, AdminDashboard
- Ancien seed administrateur supprimé ; les données de démonstration sont désormais optionnelles et isolées
- Regulatory disclaimer displayed on search, detail, and callback pages
- Medical-data warning on callback form

## Tests (iteration_1)
- Backend 29/29 pass; Frontend 100%; no critical issues

## Credentials
See /app/memory/test_credentials.md

## Backlog / Next
- P1: Add brute-force lockout on login (5 failed → 15min)
- P1: Make CORS allow_origins explicit (use FRONTEND_URL env)
- P2: Geocoder automatique ville → lat/lng (Nominatim)
- P2: Notifications email aux intervenants (Resend/SendGrid)
- P2: Pagination pour la liste admin
- P2: Mise en cache des disponibilités (TTL)
