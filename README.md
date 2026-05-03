# APA Connect

Application APA Connect avec backend FastAPI, frontend React et MongoDB.

## Stack

- Backend : FastAPI (`/backend`)
- Frontend : React/CRACO (`/frontend`)
- Base de données : MongoDB
- Cartographie : Leaflet/OpenStreetMap

## Lancement local

### 1) Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

Le frontend démarre par défaut sur `http://localhost:3000` et appelle le backend via `REACT_APP_BACKEND_URL`.

## Variables d'environnement

### Backend (`backend/.env`)

- `JWT_SECRET` : obligatoire
- `MONGO_URL` : obligatoire
- `DB_NAME` : obligatoire
- `ADMIN_EMAIL` : optionnel, seed admin local
- `ADMIN_PASSWORD` : optionnel, seed admin local
- `FRONTEND_URL` : optionnel, fallback CORS
- `CORS_ORIGINS` : optionnel, liste séparée par virgules
- `COOKIE_SECURE` : optionnel, `false` en local HTTP
- `COOKIE_SAMESITE` : optionnel, `lax`, `strict` ou `none`

### Frontend (`frontend/.env`)

- `REACT_APP_BACKEND_URL` : exemple `http://localhost:8000`

## MongoDB local

Exemple Docker rapide :

```bash
docker run -d --name mongo-apa -p 27017:27017 mongo:7
```

## Tests backend

Depuis `backend/` :

```bash
pytest tests/test_apa_connect.py
```

Les tests utilisent `BACKEND_URL` si défini, sinon `REACT_APP_BACKEND_URL`, sinon `http://localhost:8000`.

## Points à vérifier manuellement

- inscription intervenant
- connexion intervenant
- connexion admin
- affichage des intervenants
- filtres patient
- demandes de rappel
- passage manuel free/premium depuis l'admin
- affichage du badge Premium côté patient
