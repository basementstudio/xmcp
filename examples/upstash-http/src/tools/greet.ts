import { z } from "zod";
import type { InferSchema } from "xmcp";

export const schema = { name: z.string().describe("Name to greet") };
export const metadata = {
  name: "greet",
  description: "Greet someone. Costs one quota unit.",
};
export default function greet({ name }: InferSchema<typeof schema>) {
  return `Hello, ${name}!`;
}
