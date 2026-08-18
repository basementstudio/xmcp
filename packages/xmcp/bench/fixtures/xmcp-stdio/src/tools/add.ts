import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = { a: z.number(), b: z.number() };
export const metadata: ToolMetadata = {
  name: "add",
  description: "Add two numbers",
};
export default ({ a, b }: InferSchema<typeof schema>) => `${a + b}`;
