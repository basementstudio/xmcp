import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  token: z
    .string()
    .min(1)
    .describe("Sensitive token value that should be redacted in logs"),
};

export const metadata: ToolMetadata = {
  name: "observability-redact-token",
  description: "Receives token input to demonstrate redaction",
};

export default async function observabilityRedactToken({
  token,
}: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: "Token payload received." }],
    structuredContent: { accepted: true, tokenLength: token.length },
  };
}
