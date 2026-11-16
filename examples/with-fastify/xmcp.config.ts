import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  // The host checks types after xmcp generates the adapter.
  typescript: { skipTypeCheck: true },
  http: true,
  experimental: {
    adapter: "fastify",
  },
  paths: {
    prompts: false,
    resources: false,
  },
};

export default config;
