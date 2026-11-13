import type { XmcpConfig } from "xmcp";

export default {
  // The development plugin is a local bridge to one open desktop file.
  http: { host: "127.0.0.1", port: 3001 },
  paths: { tools: "./src/tools", prompts: false, resources: false },
} satisfies XmcpConfig;
