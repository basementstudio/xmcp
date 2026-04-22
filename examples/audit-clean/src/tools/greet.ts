import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().min(1).max(40).describe("Name to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Return a small greeting for the caller",
  annotations: {
    title: "Greet",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
