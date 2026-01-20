import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user with a friendly message",
  annotations: {
    title: "Greet User",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  const result = `Hello, ${name}! Welcome to the custom routes NestJS + XMCP example.`;

  return {
    content: [{ type: "text", text: result }],
  };
}
