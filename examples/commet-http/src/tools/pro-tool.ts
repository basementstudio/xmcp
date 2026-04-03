import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { headers } from "xmcp/headers";
import { commet } from "../lib/commet";

export const schema = {
  prompt: z.string().describe("The prompt to generate content from"),
};

export const metadata: ToolMetadata = {
  name: "ai-generate",
  description: "Generate content with AI — metered feature, tracks units per call",
  annotations: {
    title: "AI Generate",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// Consumption gate — track() checks access + records 1 unit
export default async function aiGenerate({
  prompt,
}: InferSchema<typeof schema>) {
  const customerKey = headers()["customer-key"];

  const result = await commet.track(customerKey as string, {
    feature: "ai-generate",
    units: 1,
  });

  if (!result.allowed) {
    return result.message;
  }

  return `Generated content for: "${prompt}" (plan: ${result.plan}, remaining: ${result.remaining ?? "unlimited"})`;
}
