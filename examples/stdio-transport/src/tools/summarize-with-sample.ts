import { z } from "zod";
import {
  getSampleTextContent,
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  topic: z.string().describe("Topic to summarize"),
};

export const metadata: ToolMetadata = {
  name: "summarize_with_sample",
  description: "Demonstrates extra.sample() without tool use",
  annotations: {
    title: "Summarize with sample",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function summarizeWithSample(
  { topic }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const result = await extra.sample({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Write a concise summary about ${topic}.`,
        },
      },
    ],
    maxTokens: 300,
    modelPreferences: {
      intelligencePriority: 0.8,
      speedPriority: 0.2,
    },
  });

  return {
    content: [
      {
        type: "text",
        text:
          getSampleTextContent(result) ||
          "The client did not return text content.",
      },
    ],
  };
}
