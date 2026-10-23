import type { InferSchema, ToolMetadata } from "xmcp";
import { grokRequest, inputSchema } from "../grok";
export const schema = inputSchema;
export const metadata: ToolMetadata = {
  name: "ask-grok",
  description:
    "Ask Grok a single text question without search. This consumes the server account's xAI API credits.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};
export default function run(input: InferSchema<typeof schema>) {
  return grokRequest(input);
}
