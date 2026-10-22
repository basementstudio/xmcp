import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

// Define the schema for prompt parameters
export const schema = {
  code: z.string().describe("The code to review"),
};

// Define prompt metadata
export const metadata: PromptMetadata = {
  icons: [
    {
      src: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2032%2032%22%3E%3Cpath%20d%3D%22m8%208%2016%2016m0-16L8%2024%22%20stroke%3D%22currentColor%22%20stroke-width%3D%224%22%2F%3E%3C%2Fsvg%3E",
      mimeType: "image/svg+xml",
      sizes: ["any"],
    },
  ],
  tags: ["development"],
  name: "review-code",
  title: "Review Code",
  description: "Review code for best practices and potential issues",
  role: "user",
};

// Prompt implementation
export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return {
    type: "text",
    text: `Please review this code for:
      - Code quality and best practices
      - Potential bugs or security issues
      - Performance optimizations
      - Readability and maintainability

      Code to review:
      \`\`\`
      ${code}
      \`\`\``,
  };
}
