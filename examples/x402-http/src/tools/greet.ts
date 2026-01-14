import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { paid } from "@xmcp-dev/x402";

// Define the schema for tool parameters
export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

// Define tool metadata
export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user (paid tool - $0.01)",
  annotations: {
    title: "Greet the user",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Paid tool implementation - uses middleware defaults ($0.01)
export default paid(async function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!! (paid by fran)`;
});
