import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("The name of the user to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the user with a friendly message",
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  const result = `Hello, ${name}! Welcome to the NestJS + XMCP example.`;

  return {
    content: [{ type: "text", text: result }],
  };
}
