import { z } from "zod";
import { type InferSchema } from "xmcp";
import { source } from "@/lib/source";
import { cleanId, getPageContent } from "@/utils/docs";
import { getBaseUrl } from "@/lib/base-url";

export const schema = {
  query: z.string().describe("Search query for docs").optional(),
  id: z
    .string()
    .describe("Document ID (e.g. 'configuration/transports')")
    .optional(),
};

export const metadata = {
  name: "search",
  description: "Search xmcp documentation.",
  annotations: {
    title: "Search xmcp documentation.",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default async function search({
  query,
  id,
}: InferSchema<typeof schema>) {
  if (id) {
    const clean = cleanId(id);
    const slugs = clean ? clean.split("/").filter(Boolean) : [];
    const page = await getPageContent(slugs);

    if (!page) {
      return `Not found: ${id}`;
    }

    return `# ${page.title}\n\n${page.content}`;
  }

  if (!query) {
    return `Provide a query or an id`;
  }

  const baseUrl = getBaseUrl();
  const response = await fetch(
    `${baseUrl}/api/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    return `Search API error: ${response.status}`;
  }

  const results = await response.json();

  if (!results.length) {
    return `No results for "${query}"`;
  }

  const seen = new Map<
    string,
    { title: string; description: string; slugs: string[] }
  >();

  for (const r of results.slice(0, 10)) {
    const clean = cleanId(r.url);
    if (seen.has(clean)) continue;

    const slugs = clean ? clean.split("/").filter(Boolean) : [];
    const page = source.getPage(slugs);
    if (page) {
      seen.set(clean, {
        title: page.data.title,
        description: page.data.description || "",
        slugs,
      });
    }
  }

  const pages = Array.from(seen.entries());

  if (pages.length === 1) {
    const [, { slugs }] = pages[0];
    const page = await getPageContent(slugs);
    if (!page) {
      return `Error reading page`;
    }
    return `# ${page.title}\n\n${page.content}`;
  }

  const list = pages
    .map(
      ([id, p], i) =>
        `${i + 1}. **${p.title}**\n   id: "${id || "index"}"\n   ${p.description}`
    )
    .join("\n\n");

  return `Found ${pages.length} pages:\n\n${list}`;
}
