import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getClient, getCustomerId } from "@xmcp-dev/commet";

export const schema = {
  prompt: z.string().describe("The prompt to send to the AI model"),
};

export const metadata: ToolMetadata = {
  name: "ai_chat",
  description: "Chat with AI, tracks token consumption per model",
};

export default async function aiChat({
  prompt,
}: InferSchema<typeof schema>) {
  const client = getClient();
  const customerId = getCustomerId();

  const { data } = await client.customer(customerId).features.check("ai_chat");

  if (!data?.allowed) {
    return "Your plan does not include this feature.";
  }

  await client.usage.track({
    feature: "ai_chat",
    customerId,
    model: "anthropic/claude-haiku-4.5",
    inputTokens: prompt.split(" ").length * 2,
    outputTokens: 6,
  });

  return `Response to: "${prompt}"`;
}
