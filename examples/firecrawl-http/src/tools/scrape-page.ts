import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { firecrawlRequest, pageMetadata, pageUrl } from "../firecrawl";

export const schema = {
  url: pageUrl,
  onlyMainContent: z
    .boolean()
    .default(true)
    .describe("Exclude navigation and footers from the returned Markdown"),
};
export const metadata: ToolMetadata = {
  name: "scrape-page",
  description:
    "Read a web page as Markdown through Firecrawl. Uses the server's Firecrawl credits.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const responseSchema = z
  .object({
    success: z.literal(true),
    data: z
      .object({ markdown: z.string(), metadata: pageMetadata })
      .passthrough(),
  })
  .passthrough();

export default function scrapePage({
  url,
  onlyMainContent,
}: InferSchema<typeof schema>) {
  return firecrawlRequest(
    "/v2/scrape",
    {
      url,
      onlyMainContent,
      formats: ["markdown"],
    },
    responseSchema
  );
}
