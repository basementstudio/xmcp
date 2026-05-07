import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "nestjs",
  },
  paths: {
    tools: true,
    prompts: false,
    resources: false,
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
