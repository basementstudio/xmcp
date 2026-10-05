import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = { name: z.string().describe("Name to greet") };
export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet someone from a TanStack server route",
};

export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
