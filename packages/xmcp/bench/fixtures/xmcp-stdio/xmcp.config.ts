import type { XmcpConfig } from "xmcp";

export default {
  stdio: true,
  paths: { prompts: false, resources: false },
} satisfies XmcpConfig;
