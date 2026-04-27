import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  name: z.string().max(64).describe("Person to greet"),
};

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet {userName} with a short hello message.",
};

export default async function greet({ name }: InferSchema<typeof schema>) {
  return `hi ${name}`;
}
