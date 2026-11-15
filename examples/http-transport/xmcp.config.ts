import { XmcpConfig } from "xmcp";

const config: XmcpConfig = {
  http: {
    // This example uses a fixed component roster and does not need subscriptions.
    maxSubscriptions: 0,
  },
  components: {
    exclude: { tags: ["internal"] },
  },
  // Listings never vary by caller here, so 2026-07-28 clients may reuse them
  // for five minutes. The scope stays "private" by default.
  cacheHints: {
    "tools/list": { ttlMs: 300_000 },
    "prompts/list": { ttlMs: 300_000 },
    "resources/list": { ttlMs: 300_000 },
  },
  typescript: {
    skipTypeCheck: true,
  },
};

export default config;
