import { pascalCase, toCamelCase, toKebabCase } from "../../../utils/naming";

export function generatePromptTemplate(name: string): string {
  const functionName = toCamelCase(name);
  const kebabName = toKebabCase(name);

  return `import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

// Define the schema for prompt parameters
export const schema = {
  // Add your parameters here
  // example: z.string().describe("Description of the parameter"),
};

// Define prompt metadata
export const metadata: PromptMetadata = {
  name: "${kebabName}",
  title: "${pascalCase(name)}",
  description: "TODO: Add description",
  role: "user",
};

// Prompt implementation
export default function ${functionName}(params: InferSchema<typeof schema>) {
  // TODO: Implement your prompt logic here
  return \`Your prompt content here\`;
}
`;
}
