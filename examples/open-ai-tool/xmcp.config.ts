import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: true,
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
  experimental: {
    ssr: {
      enabled: true,
    },
  },
};

export default config;
