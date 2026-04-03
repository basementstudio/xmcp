import { searchTool } from "@xmcp-dev/sandbox";

// Factory approach: helpers enabled by default.
// Agents get search(query), filter({ method, tag, path }), endpoints array, and raw spec.
const search = searchTool({
  url: "https://petstore3.swagger.io/api/v3/openapi.json",
  // helpers: true (default) — injects search(), filter(), endpoints
  // helpers: false — only raw spec global
});

export const schema = search.schema;
export const metadata = search.metadata;
export default search.handler;
