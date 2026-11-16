import type { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
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
