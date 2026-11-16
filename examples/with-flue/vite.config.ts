import { flue } from "@flue/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [flue({ target: "node" })],
  // xmcp builds into dist/, so the agent server gets its own output folder.
  build: { outDir: "agent-dist" },
});
