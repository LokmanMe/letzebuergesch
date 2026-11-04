/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Chemins relatifs : l'appli fonctionne à la racine d'un domaine comme dans un sous-dossier (GitHub Pages).
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg", "apple-touch-icon-180x180.png"],
      manifest: {
        name: "Lëtzebuergesch",
        short_name: "Lëtzebuergesch",
        description: "Apprendre les phrases de base en luxembourgeois, 10 minutes par jour.",
        lang: "fr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#f6f7f9",
        theme_color: "#0a6fa8",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "maskable-icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
      },
    }),
  ],
  test: {
    environment: "node",
    // Fuseau avec heure d'été pour que les tests de dates soient significatifs.
    env: { TZ: "Europe/Luxembourg" },
  },
});
