import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().min(1).max(1200).describe("Code to review"),
};

export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review a code snippet for maintainability and correctness",
  role: "user",
};

export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return `Review this snippet for readability, correctness, and safety:\n\n\`\`\`ts\n${code}\n\`\`\``;
}
