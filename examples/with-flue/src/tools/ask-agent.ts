import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { askAgent } from "../agent-client";

export const schema = { prompt: z.string().trim().min(1).max(4000) };

export const metadata: ToolMetadata = {
  name: "ask-agent",
  description:
    "Ask the shipping assistant in a new conversation. Uses model credits.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function ask(input: InferSchema<typeof schema>) {
  return askAgent(input.prompt, getRequestContext().signal);
}
