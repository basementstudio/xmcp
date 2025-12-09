import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    cors: {
      origin: "*",
      methods: ["*"],
      credentials: false,
      maxAge: 86400,
    },
  },
  paths: {
    tools: "./src/tools",
    prompts: false,
    resources: false,
  },
};

export default config;
