import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  authorization: z
    .string()
    .min(1)
    .describe("Sensitive authorization value that should be redacted in logs"),
};

export const metadata: ToolMetadata = {
  name: "observability-redact-authorization",
  description: "Receives authorization input to demonstrate redaction",
};

export default async function observabilityRedactAuthorization({
  authorization,
}: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: "Authorization payload received." }],
    structuredContent: { accepted: true, authorizationLength: authorization.length },
  };
}
