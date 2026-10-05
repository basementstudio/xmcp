import { z } from "zod";
import {
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  text: z.string().describe("Text for the client's model to summarize"),
};

export const metadata: ToolMetadata = {
  name: "preview-sampling",
  description: "Preview a basic extra.sample() flow in MCPJam",
  annotations: {
    title: "Preview sampling",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function previewSampling(
  { text }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const result = await extra.sample({
    messages: [
      {
        role: "user",
        content: { type: "text", text: `Summarize in one sentence:\n${text}` },
      },
    ],
    systemPrompt: "You summarize text concisely.",
    modelPreferences: {
      speedPriority: 0.8,
    },
    maxTokens: 200,
  });

  return JSON.stringify(result, null, 2);
}
