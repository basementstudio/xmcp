import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  apiKey: z
    .string()
    .min(1)
    .describe("Sensitive API key value that should be redacted in logs"),
};

export const metadata: ToolMetadata = {
  name: "observability-redact-apikey",
  description: "Receives apiKey input to demonstrate redaction",
};

export default async function observabilityRedactApiKey({
  apiKey,
}: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: "API key payload received." }],
    structuredContent: { accepted: true, apiKeyLength: apiKey.length },
  };
}
