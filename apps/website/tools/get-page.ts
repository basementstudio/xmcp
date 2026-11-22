import { z } from "zod";
import { type InferSchema } from "xmcp";
import { cleanId, getPageContent } from "@/utils/docs";
import { parseFrontmatter } from "@/utils/frontmatter";

export const schema = {
  id: z
    .string()
    .describe(
      "Page id from search or list-pages, for example 'core-concepts/tools'"
    ),
};

export const metadata = {
  name: "get-page",
  description: "Read one xmcp documentation page as markdown.",
  annotations: {
    title: "Read an xmcp documentation page",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default async function getPage({ id }: InferSchema<typeof schema>) {
  const slugs = cleanId(id).split("/").filter(Boolean);
  const page = await getPageContent(slugs);
  return page
    ? `# ${page.title}\n\n${parseFrontmatter(page.content).content.trim()}`
    : `Not found: ${id}. Call list-pages for the available ids.`;
}
