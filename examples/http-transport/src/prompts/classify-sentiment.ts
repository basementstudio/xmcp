import { z } from "zod";
import type { GetPromptResult, InferSchema, PromptMetadata } from "xmcp";

export const schema = {
  text: z.string().describe("The text to classify"),
};

export const metadata: PromptMetadata = {
  name: "classify-sentiment",
  title: "Classify Sentiment",
  description: "Classify sentiment using example exchanges",
};

export default function classifySentiment({
  text,
}: InferSchema<typeof schema>): GetPromptResult {
  return {
    description: "Classify the final message as positive or negative",
    messages: [
      {
        role: "user",
        content: { type: "text", text: "Classify: I love it" },
      },
      { role: "assistant", content: { type: "text", text: "positive" } },
      {
        role: "user",
        content: { type: "text", text: "Classify: I dislike it" },
      },
      { role: "assistant", content: { type: "text", text: "negative" } },
      { role: "user", content: { type: "text", text: `Classify: ${text}` } },
    ],
  };
}
