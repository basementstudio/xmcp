import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  veryLong: z.string().describe("Long string input used to demonstrate truncation"),
  items: z
    .array(z.string())
    .describe("Large array input used to demonstrate truncation markers"),
  bigObject: z
    .record(z.string(), z.string())
    .describe("Large object input used to demonstrate __truncatedKeys"),
  nested: z
    .object({
      authorization: z.string(),
      token: z.string(),
    })
    .describe("Nested sensitive values used to demonstrate redaction"),
};

export const metadata: ToolMetadata = {
  name: "observability-edge-cases",
  description:
    "Accepts oversized and sensitive payloads to demonstrate sanitization edge cases",
};

export default async function observabilityEdgeCases({
  veryLong,
  items,
  bigObject,
  nested,
}: InferSchema<typeof schema>) {
  const args = { veryLong, items, bigObject, nested };

  return {
    content: [
      {
        type: "text",
        text: "Edge-case payload accepted. Check stderr logs for truncation markers.",
      },
    ],
    structuredContent: {
      receivedKeys: Object.keys(args).length,
      message:
        "Inspect the tool.start log input field for __truncatedKeys and [TRUNCATED:n items].",
    },
  };
}
