import { z } from "zod";
import type { ToolMetadata, ToolExtraArguments } from "xmcp";
import { buildIndex, searchTools, type SearchIndex } from "../utils/search-utils";

export const schema = {
  query: z
    .string()
    .optional()
    .describe("Search query to filter tools by name or description"),
  tag: z.string().optional().describe("Filter tools by tag (e.g. 'users')"),
};

export const metadata: ToolMetadata = {
  name: "search",
  description:
    "Search available tools by name, description, or tag. Returns matching tools ranked by relevance with their input schemas so you know how to call them via the execute tool.",
  annotations: { readOnlyHint: true },
};

const META_TOOLS = new Set(["search", "execute"]);
let cachedIndex: SearchIndex | null = null;

export default async function search(
  { query, tag }: { query?: string; tag?: string },
  extra: ToolExtraArguments
) {
  let tools = extra.listTools().filter((t) => !META_TOOLS.has(t.name));

  // Tag filter (pre-filter before scoring)
  if (tag) {
    tools = tools.filter((t) => {
      const tags = (t.annotations as any)?.tags as string[] | undefined;
      return tags?.includes(tag);
    });
  }

  // If no query, return all (tag-filtered) tools
  if (!query) {
    return JSON.stringify(tools, null, 2);
  }

  // Build index lazily (tools are cached, so this is stable)
  if (!cachedIndex) {
    cachedIndex = buildIndex(extra.listTools().filter((t) => !META_TOOLS.has(t.name)));
  }

  // Score and rank results
  const scored = searchTools(cachedIndex, query);

  // If tag filter was used, intersect with tag results
  const tagNames = tag ? new Set(tools.map((t) => t.name)) : null;
  const results = tagNames
    ? scored.filter((r) => tagNames.has(r.tool.name))
    : scored;

  return JSON.stringify(
    results.map((r) => ({ ...r.tool, _relevance: Math.round(r.score * 100) / 100 })),
    null,
    2
  );
}
