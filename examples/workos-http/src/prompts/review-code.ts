import { z } from "zod";
import type { PromptMetadata } from "xmcp";

// Define the schema for prompt parameters
export const schema = {
  code: z.string().describe("The code to review"),
};

// Define prompt metadata
export const metadata: PromptMetadata = {
  name: "review-code",
  title: "Review Code",
  description: "Review code for best practices and potential issues",
  role: "user",
};

// Prompt implementation - use explicit type instead of InferSchema
export default function reviewCode({ code }: { code: string }): string {
  return `Please review this code for:
      - Code quality and best practices
      - Potential bugs or security issues
      - Performance optimizations
      - Readability and maintainability

      Code to review:
      \`\`\`
      ${code}
      \`\`\``;
}
