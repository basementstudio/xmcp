import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { edit } from "../openai";
import { imageOptions, respond } from "../options";

// OpenAI downloads these itself; this server never fetches client-supplied URLs.
const imageUrl = z.url({ protocol: /^https$/ });

export const schema = {
  prompt: z.string().trim().min(1).max(4000).describe("The change to make"),
  imageUrls: z
    .array(imageUrl)
    .min(1)
    .max(16)
    .describe("Source images as public https URLs"),
  maskUrl: imageUrl
    .optional()
    .describe("PNG whose transparent area marks where to edit"),
  ...imageOptions,
};

export const metadata: ToolMetadata = {
  name: "edit-image",
  description:
    "Edit or combine images with OpenAI's image model and return the results inline.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function editImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  return respond(
    () => edit(input.prompt, input.imageUrls, input.maskUrl, input, call),
    call
  );
}
