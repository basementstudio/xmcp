import { z } from "zod";
import type { InferSchema } from "xmcp";
export const schema = { name: z.string() };
export default function greet({ name }: InferSchema<typeof schema>) {
  return { content: [{ type: "text", text: `Hello, ${name}!` }] };
}
