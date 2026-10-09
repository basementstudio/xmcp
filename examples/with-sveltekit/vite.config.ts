import { sveltekit } from "@sveltejs/kit/vite";
import node from "@sveltejs/adapter-node";
import cloudflare from "@sveltejs/adapter-cloudflare";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    sveltekit({ adapter: process.env.XMCP_CLOUDFLARE ? cloudflare() : node() }),
  ],
});
