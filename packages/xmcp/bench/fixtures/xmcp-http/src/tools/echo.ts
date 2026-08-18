import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = { value: z.string() };
export const metadata: ToolMetadata = {
  name: "echo",
  description: "Echo text",
};
export default ({ value }: InferSchema<typeof schema>) => value;
