# Développement local du backend

Cette procédure démarre une base MongoDB et l'API sans dépendre d'Emergent. Elle
est destinée au développement et aux tests, pas à une mise en production.

## Préparation

1. Copier `backend/.env.example` vers `backend/.env`.
2. Remplacer `JWT_SECRET` par une valeur locale aléatoire d'au moins 32
   caractères.
3. Laisser `ENABLE_ADMIN_SEED=false` et `ENABLE_DEMO_SEED=false`.
4. Ne jamais committer `backend/.env`.

## Démarrage

Depuis la racine du dépôt :

```powershell
docker compose up --build
```

L'API répond ensuite sur `http://localhost:8000` et sa route de contrôle sur
`http://localhost:8000/api/health`.

## Données facultatives

La création d'un administrateur local doit être activée explicitement :

```dotenv
ENABLE_ADMIN_SEED=true
ADMIN_EMAIL=admin-local@example.test
ADMIN_PASSWORD=une-valeur-locale-de-12-caracteres-minimum
```

Les profils fictifs sont indépendants :

```dotenv
ENABLE_DEMO_SEED=true
```

Cette option est refusée lorsque `APP_ENV=production`. Les données créées
portent le marqueur `data_scope=demo`.

## Configuration de production à préparer

Avant tout futur déploiement, fournir par le gestionnaire de secrets du service :

- `APP_ENV=production` ;
- `JWT_SECRET` ;
- `MONGO_URL` ;
- `DB_NAME` ;
- `CORS_ALLOWED_ORIGINS` avec les domaines HTTPS autorisés.

Ne jamais transmettre leurs valeurs dans une issue, un commit, une capture
d'écran ou un journal de commande.
