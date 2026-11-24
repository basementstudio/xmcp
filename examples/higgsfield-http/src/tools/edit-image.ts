import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { EDIT_PATH, submit } from "../higgsfield";
import { asToolError, settle } from "../results";

export const schema = {
  prompt: z.string().trim().min(1).max(4000).describe("The change to make"),
  imageUrls: z
    .array(z.url({ protocol: /^https$/ }))
    .min(1)
    .max(10)
    .describe("Source images as public https URLs"),
  aspectRatio: z
    .enum([
      "auto",
      "1:1",
      "1:2",
      "2:1",
      "3:2",
      "2:3",
      "4:3",
      "3:4",
      "16:9",
      "9:16",
    ])
    .default("auto"),
  resolution: z.enum(["1k", "2k"]).default("1k"),
  quality: z.enum(["low", "medium"]).default("medium"),
};

export const metadata: ToolMetadata = {
  name: "edit-image",
  description:
    "Edit images with Grok Image 2.0 on Higgsfield. Returns the image, or a jobId if it takes longer than about 50 seconds.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function editImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  try {
    const jobId = await submit(
      EDIT_PATH,
      {
        prompt: input.prompt,
        image_urls: input.imageUrls,
        aspect_ratio: input.aspectRatio,
        resolution: input.resolution,
        quality: input.quality,
      },
      call
    );
    return await settle(jobId, call);
  } catch (error) {
    return asToolError(error, call);
  }
}
