import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
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
