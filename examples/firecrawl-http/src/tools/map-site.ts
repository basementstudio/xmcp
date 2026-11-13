import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import { firecrawlRequest, pageUrl } from "../firecrawl";

export const schema = {
  url: pageUrl,
  search: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe("Order discovered URLs by relevance to this query"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe("Maximum URLs to return; this does not scrape their content"),
  includeSubdomains: z.boolean().default(false),
};
export const metadata: ToolMetadata = {
  name: "map-site",
  description:
    "Discover site URLs through Firecrawl, without scraping every page. Uses the server's Firecrawl credits.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
const responseSchema = z
  .object({
    success: z.literal(true),
    links: z.array(
      z.object({
        url: z.string(),
        title: z.string().optional(),
        description: z.string().optional(),
      })
    ),
  })
  .passthrough();

export default function mapSite(input: InferSchema<typeof schema>) {
  return firecrawlRequest("/v2/map", input, responseSchema);
}
