import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("Code to review"),
};

export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review code for bugs",
  role: "user",
};

export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return `Review this code:\n\n${code}`;
}
