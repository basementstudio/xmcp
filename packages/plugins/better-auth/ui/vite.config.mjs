import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../dist/auth-ui",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        email: path.resolve(__dirname, "email.html"),
        google: path.resolve(__dirname, "google.html"),
        "email-google": path.resolve(__dirname, "email-google.html"),
      },
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith(".css")) {
            return "assets/[name].[hash][extname]";
          }
          return "assets/[name].[hash][extname]";
        },
        chunkFileNames: "assets/[name].[hash].js",
        entryFileNames: "assets/[name].[hash].js",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3001,
    host: true,
  },
  preview: {
    port: 3001,
    host: true,
  },
  base: "/auth/",
});
