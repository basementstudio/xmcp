import { z } from "zod";
import { type InferSchema } from "xmcp";
import { source } from "@/lib/source";
import { getLLMText } from "@/lib/get-llm-text";
import { slugsFromId } from "@/utils/docs";

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
  const page = source.getPage(slugsFromId(id));
  return page
    ? getLLMText(page)
    : `Not found: ${id}. Call list-pages for the available ids.`;
}
