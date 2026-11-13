import type { XmcpConfig } from "xmcp";

export default {
  stdio: { silent: true },
  paths: { tools: "./src/tools", prompts: false, resources: false },
} satisfies XmcpConfig;
