import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { imageOptions, respond } from "../options";

export const schema = {
  prompt: z.string().trim().min(1).max(4000),
  ...imageOptions,
};

export const metadata: ToolMetadata = {
  name: "generate-image",
  description:
    "Generate an image with Gemini (Nano Banana) and return it inline. Uses the server's Gemini API quota.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function generateImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  return respond(input, call);
}
