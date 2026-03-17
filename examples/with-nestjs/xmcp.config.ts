import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
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
