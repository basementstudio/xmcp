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
  description: "Greet the user with their WorkOS session info",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Tool implementation
export default async function greet({ name }: InferSchema<typeof schema>) {
  const session = await getWorkOSSession();
  return `Hello, ${name}! Your email is ${session.user.email}`;
}
