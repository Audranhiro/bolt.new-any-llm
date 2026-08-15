const fs = require("fs");
const path = require("path");

const buildDirectory = path.resolve(__dirname, "..", "build");
const sourceIndex = path.join(buildDirectory, "index.html");

const staticRoutes = [
  "patient",
  "intervenant",
  "intervenant/login",
  "intervenant/register",
  "intervenant/forgot-password",
  "intervenant/reset-password",
  "intervenant/dashboard",
  "admin",
  "admin/login",
  "kit-documents",
  "cours",
  "videos",
  "structures",
  "msp",
  "msp/demonstration",
];

if (!fs.existsSync(sourceIndex)) {
  throw new Error(`Build React introuvable : ${sourceIndex}`);
}

for (const route of staticRoutes) {
  const routeDirectory = path.join(buildDirectory, ...route.split("/"));
  fs.mkdirSync(routeDirectory, { recursive: true });
  fs.copyFileSync(sourceIndex, path.join(routeDirectory, "index.html"));
}

// GitHub Pages utilise ce fichier pour laisser React traiter les routes
// dynamiques, par exemple /patient/intervenant/:id.
fs.copyFileSync(sourceIndex, path.join(buildDirectory, "404.html"));

console.log(`Routes GitHub Pages générées : ${staticRoutes.length} routes fixes + fallback dynamique.`);
