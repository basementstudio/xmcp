import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    cors: {
      origin: "*",
      methods: ["*"],
    },
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
