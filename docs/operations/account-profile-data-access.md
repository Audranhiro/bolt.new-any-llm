# Couche d'acces aux comptes et profils

Cette couche prepare la migration progressive des comptes intervenants et de
leurs profils sans modifier les routes actuellement servies par MongoDB.

## Composants

- `records.py` definit le format canonique independant du stockage ;
- `repositories.py` definit le contrat commun asynchrone ;
- `mongo_repository.py` traduit les collections historiques ;
- `sql_repository.py` traduit les tables PostgreSQL relationnelles.

Les deux adaptateurs savent rechercher et enregistrer un compte ou un profil.
Les ecritures sont idempotentes lorsqu'elles sont rejouees avec les memes
identifiants. Les emails sont normalises en minuscules et les mots de passe ne
sont manipules que sous forme de hash existant.

## Correspondances principales

- `users` MongoDB devient `users`, `roles` et `user_roles` dans PostgreSQL ;
- `intervenants` devient `practitioners` ;
- les listes du profil deviennent des lignes `practitioner_attributes` ;
- le diplome et son etat deviennent une ligne `diplomas` ;
- `hidden=true` devient `publication_status=hidden`.

La disponibilite, les justificatifs et les autres contenus disposent deja de
tables dediees mais ne sont pas encore pris en charge par cette premiere
couche. Ils seront migres dans des etapes separees et comparables.

## Garde-fous

- aucune route de `backend/server.py` n'utilise encore ces depots ;
- aucune double ecriture n'est activee en production ;
- aucune lecture publique ne bascule vers PostgreSQL ;
- aucun mot de passe en clair n'est accepte par ces depots ;
- aucun acces distant Emergent n'est execute automatiquement ;
- tout futur import doit commencer par un mode simulation et un rapport de
  conflits, sans ecrasement silencieux.

## Simulation manuelle

La commande suivante produit uniquement un rapport de comparaison :

```powershell
python -m backend.migration_cli
```

Elle exige `MONGO_URL`, `DB_NAME` et `SQL_DATABASE_URL` dans l'environnement.
Elle ne les affiche jamais et n'effectue aucune ecriture. Les references du
rapport sont des empreintes SHA-256 tronquees et les conflits ne contiennent
que des noms de champs non sensibles ou une categorie generique pour
l'identite et les informations d'authentification.

Cette commande ne doit pas etre lancee contre le backend distant avant d'avoir
confirme les acces normaux, la sauvegarde et le perimetre des donnees.

## Prochaine etape

Ajouter un service d'import distinct, desactive par defaut, qui n'ecrira que
les elements classes `ready` apres validation explicite du rapport. Les
conflits devront rester bloques sans ecrasement silencieux.
