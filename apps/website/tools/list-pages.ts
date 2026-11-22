import { z } from "zod";
import { type InferSchema } from "xmcp";
import { source } from "@/lib/source";

const ROOT_SECTION = "overview";

export const schema = {
  section: z
    .string()
    .describe(
      "Limit the list to one section, for example 'core-concepts' or 'deployment'"
    )
    .optional(),
};

export const metadata = {
  name: "list-pages",
  description:
    "List every xmcp documentation page with its id, title, and description, grouped by section. Read a page with get-page.",
  annotations: {
    title: "List xmcp documentation pages",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

function sectionOf(slugs: string[]): string {
  return slugs.length > 1 ? slugs[0] : ROOT_SECTION;
}

export default function listPages({ section }: InferSchema<typeof schema>) {
  const pages = source
    .getPages()
    .map((page) => ({
      section: sectionOf(page.slugs),
      id: page.slugs.join("/") || "index",
      title: page.data.title,
      description: page.data.description ?? "",
    }))
    .filter((page) => !section || page.section === section);

  if (pages.length === 0) {
    return `No pages in section "${section}".`;
  }

  const sections = [...new Set(pages.map((page) => page.section))].sort();
  return sections
    .map((name) => {
      const entries = pages
        .filter((page) => page.section === name)
        .map((page) => `- ${page.id}: ${page.title}. ${page.description}`);
      return `## ${name}\n${entries.join("\n")}`;
    })
    .join("\n\n");
}
