import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    debug: true,
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
