# Sauvegarde MongoDB et retour arrière

Cette procédure doit être validée sur une base de test avant toute migration de
la base APA Connect.

## Prérequis

- MongoDB Database Tools (`mongodump` et `mongorestore`) ;
- accès réseau autorisé à la base ;
- `MONGO_URL` et `DB_NAME` définis localement, sans les afficher ;
- répertoire de sauvegarde chiffré et à accès limité.

Les archives contiennent potentiellement des données nominatives. Elles ne
doivent jamais être ajoutées au dépôt Git, envoyées par email ou placées dans un
stockage public.

## Créer une sauvegarde

```powershell
$env:MONGO_URL = "<défini dans un gestionnaire de secrets>"
$env:DB_NAME = "<base source>"
.\scripts\mongodb-backup.ps1 -OutputDirectory "D:\Sauvegardes\APA-Connect"
```

Le script crée une archive compressée ainsi qu'un fichier JSON contenant son
empreinte SHA-256. Il ne modifie pas la base.

## Vérifier la restauration

Toujours restaurer d'abord dans une base différente :

```powershell
$env:MONGO_URL = "<défini dans un gestionnaire de secrets>"
$env:DB_NAME = "<base présente dans l'archive>"
.\scripts\mongodb-restore.ps1 `
  -Archive "D:\Sauvegardes\APA-Connect\apa-connect-AAAAMMJJ-HHMMSS.archive.gz" `
  -TargetDatabase "apa_connect_restore_test" `
  -ConfirmRestore
```

Contrôler ensuite le nombre de documents par collection et tester les parcours
principaux sur cette base isolée.

## Plan de retour arrière avant migration

1. suspendre les écritures pendant la fenêtre de migration ;
2. créer une sauvegarde et vérifier son empreinte ;
3. restaurer cette sauvegarde dans une base de contrôle ;
4. noter le commit applicatif et la version du schéma ;
5. exécuter la migration avec un journal détaillé ;
6. vérifier les comptes, intervenants, demandes, cours et réservations ;
7. en cas d'échec, remettre en service le commit précédent et sélectionner la
   base restaurée ;
8. ne supprimer aucune sauvegarde avant validation fonctionnelle.

La première migration MSP ne doit pas être lancée tant que l'emplacement de
stockage, la durée de conservation et les responsables de la sauvegarde ne sont
pas formellement définis.
