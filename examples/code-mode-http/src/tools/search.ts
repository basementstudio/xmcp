import { z } from "zod";
import type { ToolMetadata, ToolExtraArguments } from "xmcp";

export const schema = {
  query: z.string().describe("Search query to filter available tools"),
};

export const metadata: ToolMetadata = {
  name: "search",
  description:
    "Search available tools by name or description. Returns matching tools with their input schemas so you know how to call them.",
  annotations: { readOnlyHint: true },
};

const META_TOOLS = new Set(["search", "execute"]);

export default async function search(
  { query }: { query: string },
  extra: ToolExtraArguments
) {
  const tools = extra.listTools();
  const q = query.toLowerCase();

  const matches = tools
    .filter((t) => !META_TOOLS.has(t.name))
    .filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
    );

  return JSON.stringify(matches, null, 2);
}
