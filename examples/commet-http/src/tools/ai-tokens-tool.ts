import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { headers } from "xmcp/headers";
import { commet } from "../lib/commet";

export const schema = {
  prompt: z.string().describe("The prompt to send to the AI model"),
};

export const metadata: ToolMetadata = {
  name: "ai-chat",
  description: "Chat with AI — balance feature, tracks tokens per model",
  annotations: {
    title: "AI Chat",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false,
  },
};

// AI token tracking — check() first, then track() with model and token counts
export default async function aiChat({
  prompt,
}: InferSchema<typeof schema>) {
  const customerKey = headers()["customer-key"];

  // Check access before calling the model
  const preCheck = await commet.check(customerKey as string, "ai-chat");
  if (!preCheck.allowed) {
    return preCheck.message;
  }

  // Call your AI model here...
  const aiResponse = `Response to: "${prompt}"`;
  const inputTokens = prompt.split(" ").length * 2;
  const outputTokens = aiResponse.split(" ").length * 2;

  // Track actual token consumption after the call
  await commet.track(customerKey as string, {
    feature: "ai-chat",
    model: "claude-sonnet-4-20250514",
    inputTokens,
    outputTokens,
  });

  return aiResponse;
}
