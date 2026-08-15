# Migrations PostgreSQL

Ce dossier prepare le nouveau socle relationnel. Il ne remplace pas MongoDB et
ne doit jamais etre execute contre une base de production sans sauvegarde,
restauration de controle et validation explicite.

La migration initiale n'est volontairement pas generee tant que les modeles et
contraintes n'ont pas ete revus et testes avec PostgreSQL local.
