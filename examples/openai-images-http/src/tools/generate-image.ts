import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { generate } from "../openai";
import { imageOptions, respond } from "../options";

export const schema = {
  prompt: z.string().trim().min(1).max(4000),
  ...imageOptions,
};

export const metadata: ToolMetadata = {
  name: "generate-image",
  description:
    "Generate images with OpenAI's image model and return them inline. Uses the server's OpenAI API credits.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function generateImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  return respond(() => generate(input.prompt, input, call), call);
}
