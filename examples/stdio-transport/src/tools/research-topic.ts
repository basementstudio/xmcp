import { z } from "zod";
import {
  getSampleTextContent,
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";

export const schema = {
  topic: z.string().describe("Topic to research"),
};

export const metadata: ToolMetadata = {
  name: "research_topic",
  description: "Demonstrates extra.sample() with local tool execution",
  annotations: {
    title: "Research topic",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function researchTopic(
  { topic }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const result = await extra.sample({
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: `Research ${topic} using the local tools and give me a short answer.`,
        },
      },
    ],
    tools: ["search_docs"],
    toolChoice: { mode: "required" },
    maxTokens: 500,
    maxSteps: 4,
  });

  return {
    content: [
      {
        type: "text",
        text: getSampleTextContent(result) || "No text returned.",
      },
    ],
  };
}
