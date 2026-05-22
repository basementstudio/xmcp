import { type ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "cached-catalog",
  description: "Return a slow-changing catalog whose listing can be cached",
  ttlMs: 60_000,
  cacheScope: "global",
};

// Tool implementation
export default async function cachedCatalog() {
  return ["alpha", "beta", "gamma"].join(", ");
}
