import type { XmcpConfig } from "xmcp";

const FIVE_MINUTES_MS = 300_000;
const ONE_HOUR_MS = 3_600_000;

export default {
  http: { maxSubscriptions: 0 },
  paths: { prompts: false },
  cacheHints: {
    "server/discover": { ttlMs: ONE_HOUR_MS, cacheScope: "public" },
    "tools/list": { ttlMs: FIVE_MINUTES_MS, cacheScope: "public" },
    "resources/list": { ttlMs: FIVE_MINUTES_MS, cacheScope: "public" },
  },
} satisfies XmcpConfig;
