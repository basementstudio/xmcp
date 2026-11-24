import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { submit } from "../bfl";
import { outputOptions } from "../options";
import { asToolError, settle } from "../results";

export const schema = {
  prompt: z.string().trim().min(1).max(4000).describe("The change to make"),
  imageUrls: z
    .array(z.url({ protocol: /^https$/ }))
    .min(1)
    .max(8)
    .describe("Source and reference images as public https URLs"),
  ...outputOptions,
};

export const metadata: ToolMetadata = {
  name: "edit-image",
  description:
    "Edit or combine images with FLUX.2 [pro]. Returns the image, or a pollingUrl if it takes longer than about 50 seconds.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function editImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  try {
    return await settle(await submit(input, call), call);
  } catch (error) {
    return asToolError(error, call);
  }
}
