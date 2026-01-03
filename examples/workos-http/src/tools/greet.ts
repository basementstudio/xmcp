import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getWorkOSSession } from "@xmcp-dev/workos";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user with their WorkOS identity",
  annotations: {
    title: "Greet User",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function greet({ name }: InferSchema<typeof schema>) {
  const session = getWorkOSSession();

  const result = `Hello, ${name}! Your WorkOS user ID is ${session.userId}`;

  return {
    content: [{ type: "text", text: result }],
  };
}
