import { z } from "zod";
import { type InferSchema, type PromptMetadata } from "xmcp";

export const schema = {
  name: z.string().describe("Name to greet"),
};

export const metadata: PromptMetadata = {
  name: "greet",
  title: "Greet",
  description: "Generate a greeting",
  role: "user",
};

export default function greet({ name }: InferSchema<typeof schema>) {
  return {
    type: "text",
    text: `Hello, ${name}!`,
  };
}
