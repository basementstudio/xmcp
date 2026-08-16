import { z } from "zod";
import {
  getSampleContext,
  type InferSchema,
  type ToolExtraArguments,
  sample,
} from "xmcp";

export const schema = {
  topic: z.string().describe("Topic to summarize"),
};

export const outputSchema = {
  summary: z.string(),
};

export const metadata = {
  name: "summarize_with_sample",
  description: "Demonstrates xmcp sampling without tool use",
};

export default async function summarizeWithSample(
  { topic }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const result = await sample(extra, {
    messages: [
      {
        role: "user",
        content: `Write a concise summary about ${topic}.`,
      },
    ],
    maxTokens: 300,
  });

  return getSampleContext(result) || "The client did not return text content.";
}
