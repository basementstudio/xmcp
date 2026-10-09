import type { XmcpConfig } from "xmcp";

export default {
  http: true,
  stdio: true,
  paths: { tools: "./src/tools", prompts: false, resources: false },
  experimental: { inferToolSchemas: true },
} satisfies XmcpConfig;
