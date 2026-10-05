import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  nitro: {
    // Nitro must bundle the adapter so its application imports rebuild in dev.
    externals: { inline: [/\.xmcp\//] },
  },
});
