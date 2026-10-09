import type { XmcpConfig } from "xmcp";

export default {
  http: true,
  paths: { tools: "./src/tools", prompts: false, resources: false },
} satisfies XmcpConfig;
