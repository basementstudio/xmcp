import type { XmcpConfig } from "xmcp";

export default {
  http: { port: 3011 },
  paths: { prompts: false, resources: false },
} satisfies XmcpConfig;
