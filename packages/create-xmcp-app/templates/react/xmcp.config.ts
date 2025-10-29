import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
  experimental: {
    react: true,
  },
};

export default config;
