import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  code: z.string().describe("The code to review"),
  language: z.string().optional().describe("The programming language of the code"),
};

export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review code for best practices, bugs, and improvements",
  role: "user",
};

export default function reviewCode({ code, language }: InferSchema<typeof schema>) {
  const langHint = language ? ` (${language})` : "";

  return `Please review this code${langHint} for:
- Code quality and best practices
- Potential bugs or security issues
- Performance optimizations
- Readability and maintainability

Code to review:
\`\`\`${language || ""}
${code}
\`\`\``;
}
