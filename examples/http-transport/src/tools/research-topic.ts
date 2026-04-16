import { z } from "zod";
import {
  getSampleTextContent,
  type InferSchema,
  type ToolExtraArguments,
  sample,
} from "xmcp";

export const schema = {
  topic: z.string().describe("Topic to research"),
};

export const metadata = {
  name: "research_topic",
  description: "Demonstrates xmcp sampling with local tool execution",
};

export default async function researchTopic(
  { topic }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const result = await sample(extra, {
    messages: [
      {
        role: "user",
        content: `Research ${topic} using the local tools and give me a short answer.`,
      },
    ],
    tools: ["search_docs"],
    toolChoice: { mode: "required" },
    maxTokens: 500,
    maxSteps: 4,
  });

  return getSampleTextContent(result) || "No text returned.";
}
