import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  errorMessage: z.string().describe("The error message to explain"),
  context: z.string().optional().describe("Additional context about where the error occurred"),
};

export const metadata: PromptMetadata = {
  name: "explain-error",
  title: "Explain Error",
  description: "Get a detailed explanation of an error message and suggestions for fixing it",
  role: "user",
};

export default function explainError({ errorMessage, context }: InferSchema<typeof schema>) {
  const contextSection = context
    ? `\nContext: ${context}`
    : "";

  return `Please help me understand and fix this error:

Error message:
\`\`\`
${errorMessage}
\`\`\`
${contextSection}

Please provide:
1. A clear explanation of what this error means
2. Common causes for this type of error
3. Step-by-step suggestions to fix it
4. How to prevent this error in the future`;
}
