import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  // The host checks types after xmcp generates the adapter.
  typescript: { skipTypeCheck: true },
  http: true,
  experimental: {
    adapter: "nextjs",
  },
  paths: {
    tools: "src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
