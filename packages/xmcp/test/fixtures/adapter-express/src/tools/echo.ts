import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  message: z.string().describe("Message to echo back"),
};

export const metadata: ToolMetadata = {
  name: "echo",
  description: "Echo a message back to the caller",
};

export default function echo({ message }: InferSchema<typeof schema>) {
  return `echo: ${message}`;
}
