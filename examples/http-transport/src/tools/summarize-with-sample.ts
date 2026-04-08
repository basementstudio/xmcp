import { z } from "zod";
import {
  getSampleContext,
  type InferSchema,
  type ToolExtraArguments,
} from "xmcp";

export const schema = {
  topic: z.string().describe("Topic to summarize"),
};

export const outputSchema = {
  summary: z.string(),
};

export const metadata = {
  name: "summarize_with_sample",
  description: "Demonstrates extra.sample() without tool use",
};

export default async function summarizeWithSample(
  { topic }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  try {
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
    });

    return getSampleContext(result) || "The client did not return text content.";
  } catch (error) {
    const message =
      error instanceof Error && error.message ? error.message : String(error);

    if (
      !message.includes("does not support MCP sampling") &&
      !message.includes("sampling/createMessage") &&
      !message.includes("Method not found")
    ) {
      throw error;
    }

    return `Fallback summary for "${topic}": the connected MCP client does not implement sampling/createMessage yet, so this demo returned a deterministic response instead of model-generated text.`;
  }
}
