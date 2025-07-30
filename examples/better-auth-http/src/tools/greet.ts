import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getBetterAuthSession } from "@xmcp-dev/better-auth";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
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
  const session = getBetterAuthSession();

  if (!session) {
    return {
      content: [{ type: "text", text: "You are not authenticated" }],
    };
  }

  const result = `Hello, ${name}! Your user id is ${session.userId}`;

  return {
    content: [{ type: "text", text: result }],
  };
}
