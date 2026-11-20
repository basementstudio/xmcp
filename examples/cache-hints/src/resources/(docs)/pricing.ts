import type { ResourceMetadata } from "xmcp";

const ONE_DAY_MS = 86_400_000;

export const metadata: ResourceMetadata = {
  name: "pricing",
  title: "Pricing",
  description: "Plan prices, updated at most once a day",
  cacheHint: { ttlMs: ONE_DAY_MS, cacheScope: "public" },
};

export default function pricing() {
  return JSON.stringify({ starter: 0, team: 2900, business: 9900 });
}
