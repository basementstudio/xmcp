import type { InferSchema, ToolMetadata } from "xmcp";
import { grokRequest, inputSchema } from "../grok";
export const schema = inputSchema;
export const metadata: ToolMetadata = {
  name: "search-web-with-grok",
  description:
    "Ask Grok to search the web and return an answer with available source citations. Consumes xAI model and search credits.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};
export default function run(input: InferSchema<typeof schema>) {
  return grokRequest(input, "web_search");
}
