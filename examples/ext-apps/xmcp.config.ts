import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    cors: {
      origin: "*",
      methods: ["*"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "mcp-session-id",
        "mcp-protocol-version",
      ],
      exposedHeaders: ["Content-Type", "Authorization", "mcp-session-id"],
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
