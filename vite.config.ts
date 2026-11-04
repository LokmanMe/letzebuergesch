/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  test: {
    environment: "node",
    // Fuseau avec heure d'été pour que les tests de dates soient significatifs.
    env: { TZ: "Europe/Luxembourg" },
  },
});
