import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    debug: true,
  },
  experimental: {
    adapter: "cloudflare",
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
