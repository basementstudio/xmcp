import { z } from "zod";
import { type InferSchema } from "xmcp";
import { source } from "@/lib/source";
import { createFromSource } from "fumadocs-core/search/server";
import fs from "fs/promises";
import path from "path";

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
    destructiveHint: false,
    idempotentHint: true,
  },
};

const searchAPI = createFromSource(source, { language: "english" });

function cleanId(id: string) {
  return id.replace(/^\/docs\/?/, "").replace(/-\d+$/, "");
}

async function getPageContent(slugs: string[]) {
  const page = source.getPage(slugs);
  if (!page) return null;

  const filePath = slugs.length ? `${slugs.join("/")}.mdx` : "index.mdx";
  const mdxPath = path.join(process.cwd(), "content/docs", filePath);
  const content = await fs.readFile(mdxPath, "utf-8");

  return {
    title: page.data.title,
    description: page.data.description,
    content,
  };
}

export default async function search({
  query,
  id,
  // @ts-expect-error: TO DO: fix InferSchema err in 0.5.5
}: InferSchema<typeof schema>) {
  if (id) {
    const clean = cleanId(id);
    const slugs = clean ? clean.split("/").filter(Boolean) : [];
    const page = await getPageContent(slugs);

    if (!page) {
      return { content: [{ type: "text", text: `Not found: ${id}` }] };
    }

    return {
      content: [{ type: "text", text: `# ${page.title}\n\n${page.content}` }],
    };
  }

  if (!query) {
    return { content: [{ type: "text", text: `Provide a query or an id` }] };
  }

  const results = await searchAPI.search(query);

  if (!results.length) {
    return { content: [{ type: "text", text: `No results for "${query}"` }] };
  }

  const seen = new Map<
    string,
    { title: string; description: string; slugs: string[] }
  >();

  for (const r of results) {
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
      return { content: [{ type: "text", text: `Error reading page` }] };
    }
    return {
      content: [{ type: "text", text: `# ${page.title}\n\n${page.content}` }],
    };
  }

  const list = pages
    .map(
      ([id, p], i) =>
        `${i + 1}. **${p.title}**\n   id: "${id || "index"}"\n   ${p.description}`
    )
    .join("\n\n");

  return {
    content: [
      { type: "text", text: `Found ${pages.length} pages:\n\n${list}` },
    ],
  };
}
