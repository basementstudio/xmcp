import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { imageOptions, respond } from "../options";

/** About 7 MB of base64, roughly a 5 MB image, per source image. */
const MAX_IMAGE_BASE64_LENGTH = 7_000_000;

export const schema = {
  prompt: z.string().trim().min(1).max(4000).describe("The change to make"),
  images: z
    .array(
      z.object({
        data: z
          .base64()
          .max(MAX_IMAGE_BASE64_LENGTH)
          .describe("Base64 image bytes"),
        mimeType: z.enum(["image/png", "image/jpeg", "image/webp"]),
      })
    )
    .min(1)
    .max(4)
    .describe("Source and reference images, sent inline"),
  ...imageOptions,
};

export const metadata: ToolMetadata = {
  name: "edit-image",
  description:
    "Edit or combine images with Gemini (Nano Banana) and return the result inline. Send source images as base64.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function editImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  return respond(input, call);
}
