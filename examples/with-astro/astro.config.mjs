import { defineConfig } from "astro/config";
import node from "@astrojs/node";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: process.env.XMCP_CLOUDFLARE
    ? cloudflare()
    : node({ mode: "standalone" }),
});
