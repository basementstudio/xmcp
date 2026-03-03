import { pascalCase, toCamelCase, toKebabCase } from "../../../utils/naming";

export function generateToolTemplate(name: string): string {
  const functionName = toCamelCase(name);
  const kebabName = toKebabCase(name);

  return `import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";

// Define the schema for tool parameters
export const schema = {
  // Add your parameters here
  // example: z.string().describe("Description of the parameter"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "${kebabName}",
  description: "TODO: Add description",
  annotations: {
    title: "${pascalCase(name)}",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export const outputSchema = {
  message: z.string(),
};

// Tool implementation
export default function ${functionName}(params: InferSchema<typeof schema>) {
  // TODO: Implement your tool logic here
  return {
    content: [{ type: "text", text: "Hello from ${name}!" }],
    structuredContent: {
      message: "Hello from ${name}!",
    },
  };
}
`;
}
