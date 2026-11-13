import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { firecrawlRequest, pageMetadata, pageUrl } from "../firecrawl";

export const schema = { url: pageUrl };
export const metadata: ToolMetadata = {
  name: "extract-page-summary",
  description:
    "Extract a page's title, description, headings, and topics using Firecrawl JSON mode. Model-generated results need review; uses Firecrawl credits.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const summarySchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  headings: z.array(z.string()),
  topics: z.array(z.string()),
});
const responseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({ json: summarySchema, metadata: pageMetadata })
      .passthrough(),
  })
  .passthrough();

export default function extractPageSummary({
  url,
}: InferSchema<typeof schema>) {
  return firecrawlRequest(
    "/v2/scrape",
    {
      url,
      onlyMainContent: true,
      formats: [
        {
          type: "json",
          prompt:
            "Extract the page title, description, main content headings, and topics supported by the page. Use null for missing title or description, and empty arrays for missing headings or topics. Do not invent facts or SEO scores.",
          schema: z.toJSONSchema(summarySchema),
        },
      ],
    },
    responseSchema
  );
}
