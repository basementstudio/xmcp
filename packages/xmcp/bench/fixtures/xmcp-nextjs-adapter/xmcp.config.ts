import type { XmcpConfig } from "xmcp";

export default {
  http: true,
  experimental: { adapter: "nextjs" },
  paths: { prompts: false, resources: false },
} satisfies XmcpConfig;
