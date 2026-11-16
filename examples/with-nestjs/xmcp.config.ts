import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  // The host checks types after xmcp generates the adapter.
  typescript: { skipTypeCheck: true },
  http: true,
  paths: {
    prompts: false,
    resources: false,
  },
  experimental: {
    adapter: "nestjs",
  },
};

export default config;
