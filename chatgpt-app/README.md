# APA Connect — application ChatGPT

Cette partie du dépôt expose APA Connect comme une application ChatGPT fondée sur MCP Apps.

## Fonctions disponibles

- ouvrir une interface APA Connect dans ChatGPT ;
- rechercher des intervenants APA par ville, disponibilité, intervention à domicile ou diplôme vérifié ;
- rechercher des cours d'activité physique adaptée, avec priorité aux cours sur chaise ;
- envoyer une demande de rappel à un intervenant ;
- réserver une place à un cours.

L'application réutilise le backend FastAPI déjà présent dans APA Connect. Elle n'utilise pas l'API OpenAI et ne nécessite donc pas de clé OpenAI pour fonctionner dans ChatGPT.

## Configuration

Copier `.env.example` dans `.env` ou définir les variables sur la plateforme d'hébergement :

```bash
APA_CONNECT_API_URL=https://votre-backend.example.com
APA_CONNECT_SITE_URL=https://votre-site.example.com
PORT=2091
```

`APA_CONNECT_API_URL` peut contenir le suffixe `/api` ou non.

## Lancer en local

```bash
cd chatgpt-app
npm install
APA_CONNECT_API_URL=http://127.0.0.1:8000 npm start
```

Le serveur répond sur :

- état : `http://127.0.0.1:2091/health`
- MCP : `http://127.0.0.1:2091/mcp`

## Tester dans ChatGPT

ChatGPT doit joindre le serveur via une URL HTTPS publique.

1. Lancer le serveur localement.
2. Exposer le port 2091 avec un tunnel HTTPS, par exemple `ngrok http 2091`.
3. Dans ChatGPT, activer le mode développeur dans les réglages des applications ou plugins.
4. Ajouter une application MCP avec l'URL `https://votre-sous-domaine.ngrok.app/mcp`.
5. Actualiser l'application après toute modification des outils ou du widget.

Exemples de demandes :

- « Ouvre APA Connect. »
- « Trouve-moi un intervenant APA disponible cette semaine à Rouen. »
- « Trouve-moi un cours sur chaise près de Barentin. »
- « Réserve ce cours avec mon nom et mon email. »

## Déployer

Le dossier contient un `Dockerfile`. Il peut être déployé sur Render, Railway, Fly.io, Cloud Run ou une autre plateforme acceptant les conteneurs et les connexions HTTP en streaming.

Exemple de construction :

```bash
docker build -t apa-connect-chatgpt .
docker run --rm -p 2091:2091 \
  -e APA_CONNECT_API_URL=https://votre-backend.example.com \
  -e APA_CONNECT_SITE_URL=https://votre-site.example.com \
  apa-connect-chatgpt
```

En production, l'URL MCP doit être stable, publique et en HTTPS.

## Filigrane Emergent

Le badge, le script externe, le suivi PostHog Emergent et le module de modification visuelle Emergent ont été retirés de la branche dédiée. La version hébergée en dehors de la prévisualisation Emergent ne contient donc plus le filigrane Emergent.
