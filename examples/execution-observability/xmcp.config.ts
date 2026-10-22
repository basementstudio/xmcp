import type { XmcpConfig } from "xmcp";
export default {
  http: { port: 3001 },
  stdio: { silent: true },
  observability: { enabled: true },
} satisfies XmcpConfig;
