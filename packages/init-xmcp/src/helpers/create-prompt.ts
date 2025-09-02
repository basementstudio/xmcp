import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create prompts directory and prompt file
 * @param projectRoot - Project root directory
 * @param promptsPath - Path for prompts directory (relative to project root)
 */
export function createPrompt(projectRoot: string, promptsPath: string): void {
  // normalize the path to handle any path separators correctly
  const normalizedPromptsPath = path.normalize(promptsPath);
  const promptsDirPath = path.join(projectRoot, normalizedPromptsPath);

  try {
    // create prompts directory and all parent directories
    fs.ensureDirSync(promptsDirPath);

    const promptFilePath = path.join(promptsDirPath, "review-code.ts");
    fs.writeFileSync(promptFilePath, promptTemplate);

    console.log(
      chalk.green(`Created prompt: ${normalizedPromptsPath}/review-code.ts`)
    );
  } catch (error) {
    console.error(chalk.red(`Failed to create prompt: ${error}`));
    throw error;
  }
}

const promptTemplate = `import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

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

// Prompt implementation
export default function reviewCode({ code }: InferSchema<typeof schema>) {
  return \`Please review this code for:
      - Code quality and best practices
      - Potential bugs or security issues
      - Performance optimizations
      - Readability and maintainability

      Code to review:
      \\\`\\\`\\\`
      \${code}
      \\\`\\\`\\\`\`;
}
`;
