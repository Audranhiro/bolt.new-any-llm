# Déploiement indépendant du backend APA Connect

Le backend FastAPI peut être déployé depuis le `backend/Dockerfile` sans
Emergent. Le frontend public ne doit être basculé vers ce backend qu'après la
validation complète d'un environnement de test.

## Services nécessaires

- un hébergeur capable de construire et exécuter un conteneur Docker ;
- une base MongoDB avec TLS, sauvegardes et restauration testée ;
- un gestionnaire de secrets fourni par l'hébergeur ;
- le sous-domaine HTTPS `api.apaconnect.fr` après validation.

La base et le service doivent être placés dans une région européenne. Cette
localisation ne constitue pas, à elle seule, une certification HDS.

## Variables obligatoires

Les valeurs sont à saisir uniquement dans le gestionnaire de secrets de
l'hébergeur. Elles ne doivent jamais être placées dans Git, une issue, un log
ou une capture d'écran.

| Variable | Valeur attendue en production |
| --- | --- |
| `APP_ENV` | `production` |
| `JWT_SECRET` | valeur aléatoire d'au moins 32 caractères |
| `MONGO_URL` | URI MongoDB TLS fournie comme secret |
| `DB_NAME` | nom de la base de production |
| `CORS_ALLOWED_ORIGINS` | `https://apaconnect.fr,https://www.apaconnect.fr` |
| `COOKIE_SECURE` | `true` |
| `COOKIE_SAMESITE` | `none` tant que le frontend et l'API sont sur des sites différents |
| `ENABLE_DEMO_SEED` | `false` |
| `ENABLE_ADMIN_SEED` | `false`, sauf amorçage temporaire contrôlé |

## Création initiale de l'administrateur

Sur une base neuve seulement :

1. définir temporairement `ENABLE_ADMIN_SEED=true` ;
2. fournir `ADMIN_EMAIL` et un `ADMIN_PASSWORD` fort via le gestionnaire de
   secrets ;
3. déployer puis vérifier la connexion administrateur ;
4. remettre `ENABLE_ADMIN_SEED=false` ;
5. supprimer `ADMIN_PASSWORD` du gestionnaire de secrets ;
6. redéployer et vérifier que la connexion existante fonctionne toujours.

Le mot de passe ne doit apparaître dans aucune commande enregistrée ni dans les
logs. Le backend ne journalise jamais sa valeur.

## Contrôles de déploiement

L'hébergeur peut utiliser :

```text
GET /api/health
```

Réponse prête :

```json
{"status":"ok","database":"connected"}
```

Une base indisponible produit un statut HTTP 503 sans exposer l'adresse ou
l'erreur interne de MongoDB.

## Validation avant la bascule

1. créer une base de test vide ;
2. déployer le conteneur et vérifier `/api/health` ;
3. créer l'administrateur initial ;
4. tester inscription, connexion, profil, disponibilités et administration ;
5. tester une sauvegarde puis sa restauration dans une autre base ;
6. vérifier CORS depuis `https://apaconnect.fr` ;
7. vérifier les cookies sécurisés et l'absence de secrets dans les logs ;
8. connecter `api.apaconnect.fr` et son certificat HTTPS ;
9. construire le frontend avec
   `REACT_APP_BACKEND_URL=https://api.apaconnect.fr` ;
10. conserver l'ancien backend comme retour arrière jusqu'à validation.

Les tests d'intégration susceptibles d'écrire des données ne ciblent aucun
service par défaut. Ils exigent explicitement :

```text
APA_TEST_BASE_URL=https://adresse-de-l-environnement-de-test
```

Ne jamais définir cette variable vers la production. Les tests unitaires sont
exécutés automatiquement par `.github/workflows/backend-tests.yml`.

## Retour arrière

Si un contrôle échoue, ne pas modifier le frontend public. S'il a déjà été
basculé, redéployer le dernier commit frontend utilisant l'ancienne URL, puis
analyser le nouvel environnement sans supprimer sa base ni ses journaux.
