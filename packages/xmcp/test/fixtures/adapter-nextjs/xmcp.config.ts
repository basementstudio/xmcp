import { type XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  experimental: {
    adapter: "nextjs",
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
