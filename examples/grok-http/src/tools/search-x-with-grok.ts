import type { InferSchema, ToolMetadata } from "xmcp";
import { grokRequest, inputSchema } from "../grok";
export const schema = inputSchema;
export const metadata: ToolMetadata = {
  name: "search-x-with-grok",
  description:
    "Ask Grok to search X posts and return an answer with available citations. This is read-only research; it does not publish posts or access the X account token.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};
export default function run(input: InferSchema<typeof schema>) {
  return grokRequest(input, "x_search");
}
