import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().min(1).describe("Name to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Returns a greeting message",
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  const response = {
    message: `Hello, ${name}!`,
    greetedAt: new Date().toISOString(),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(response) }],
    structuredContent: response,
  };
}
