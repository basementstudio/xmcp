import { z } from "zod";
import {
  getSampleTextContent,
  type InferSchema,
  type ToolExtraArguments,
} from "xmcp";
import searchDocs from "./search-docs";

export const schema = {
  topic: z.string().describe("Topic to research"),
};

export const metadata = {
  name: "research_topic",
  description: "Demonstrates extra.sample() with local tool execution",
};

export default async function researchTopic(
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
            text: `Research ${topic} using the local tools and give me a short answer.`,
          },
        },
      ],
      tools: ["search_docs"],
      toolChoice: { mode: "required" },
      maxTokens: 500,
      maxSteps: 4,
    });

    return getSampleTextContent(result) || "No text returned.";
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

    const docsHit = await searchDocs({ query: topic });

    return `Fallback research for "${topic}": the connected MCP client does not implement sampling/createMessage yet, so this demo called the local search_docs tool directly. ${docsHit}`;
  }
}
