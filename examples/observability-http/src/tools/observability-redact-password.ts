import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  password: z
    .string()
    .min(1)
    .describe("Sensitive password value that should be redacted in logs"),
};

export const metadata: ToolMetadata = {
  name: "observability-redact-password",
  description: "Receives password input to demonstrate redaction",
};

export default async function observabilityRedactPassword({
  password,
}: InferSchema<typeof schema>) {
  return {
    content: [{ type: "text", text: "Password payload received." }],
    structuredContent: { accepted: true, passwordLength: password.length },
  };
}
