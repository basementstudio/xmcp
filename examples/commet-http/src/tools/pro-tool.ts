import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getClient, getCustomerId } from "@xmcp-dev/commet";

export const schema = {
  prompt: z.string().describe("The prompt to generate content from"),
};

export const metadata: ToolMetadata = {
  name: "ai_generate",
  description: "Generate content with AI, tracks 1 unit per call",
};

export default async function aiGenerate({
  prompt,
}: InferSchema<typeof schema>) {
  const client = getClient();
  const customerId = getCustomerId();

  const { data } = await client.customer(customerId).features.check("ai_generate");

  if (!data?.allowed) {
    return "Your plan does not include this feature.";
  }

  await client.usage.track({
    feature: "ai_generate",
    customerId,
    value: 1,
  });

  return `Generated content for: "${prompt}"`;
}
