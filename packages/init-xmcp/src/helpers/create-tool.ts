import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

/**
 * Create tools directory and tool file
 * @param projectRoot - Project root directory
 * @param toolsPath - Path for tools directory (relative to project root)
 */
export function createTool(projectRoot: string, toolsPath: string): void {
  // normalize the path to handle any path separators correctly
  const normalizedToolsPath = path.normalize(toolsPath);
  const toolsDirPath = path.join(projectRoot, normalizedToolsPath);

  try {
    // create tools directory and all parent directories
    fs.ensureDirSync(toolsDirPath);

    const toolFilePath = path.join(toolsDirPath, "greet.ts");
    fs.writeFileSync(toolFilePath, toolTemplate);

    console.log(chalk.green(`Created tool: ${normalizedToolsPath}/greet.ts`));
  } catch (error) {
    console.error(chalk.red(`Failed to create tool: ${error}`));
    throw error;
  }
}

const toolTemplate = `import { z } from "zod";
import { type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata = {
  name: "greet",
  description: "Greet the user",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function greet({ name }: InferSchema<typeof schema>) {
  return \`Hello, \${name}!\`;
}
`;
