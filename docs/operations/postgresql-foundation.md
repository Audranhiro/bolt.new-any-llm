# Fondation PostgreSQL APA Connect

Le socle relationnel est ajoute en parallele du backend MongoDB actuel. Il est
desactive par defaut avec `SQL_BACKEND_ENABLED=false`. Aucun import de ces
modeles n'est effectue par `backend/server.py`, donc le service public existant
ne change pas.

## Garde-fous

- ne pas definir `SQL_BACKEND_ENABLED=true` en production avant validation ;
- ne jamais enregistrer `SQL_DATABASE_URL` dans Git ;
- generer et relire la migration initiale sur une base locale vide ;
- tester sauvegarde et restauration avant tout import Emergent ;
- conserver MongoDB comme retour arriere pendant les comparaisons ;
- utiliser exclusivement des donnees fictives pour le module MSP.

## Demarrage local

```powershell
docker compose --profile postgres up -d postgres
```

La valeur locale d'exemple est documentee dans `backend/.env.example`. En
production, la valeur devra provenir uniquement du gestionnaire de secrets de
l'hebergeur.

## Etat de cette etape

Les modeles, la configuration Alembic et la migration initiale sont prepares.
La migration `1ee17a60d91c_initial_relational_foundation.py` a ete generee sur
une base PostgreSQL 16 locale vide, puis validee avec le cycle suivant :

1. migration vers la revision courante ;
2. verification des 26 tables metier et de la table de version Alembic ;
3. retour complet a la base vide ;
4. nouvelle migration vers la revision courante ;
5. controle Alembic sans difference residuelle.

Cette validation locale ne branche pas encore le serveur FastAPI sur
PostgreSQL pour ses routes metier et ne migre aucune donnee Emergent.

Le serveur initialise toutefois une connexion PostgreSQL optionnelle lorsque
`SQL_BACKEND_ENABLED=true`. Dans ce mode, `/api/health` controle MongoDB et
PostgreSQL sans exposer d'adresse, d'identifiant ni de detail d'erreur. Les
sessions SQL appliquent automatiquement un commit ou un rollback et ferment
toujours leur connexion.

Pour revenir instantanement au comportement historique, definir
`SQL_BACKEND_ENABLED=false` ou omettre cette variable. Le serveur continue
alors d'utiliser exclusivement MongoDB pour toutes les fonctions existantes.

Les migrations doivent rester une etape de deploiement explicite : le serveur
ne les applique jamais automatiquement au demarrage.
