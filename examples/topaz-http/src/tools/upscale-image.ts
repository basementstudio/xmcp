import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { submitUpscale } from "../topaz";
import { asToolError, settle } from "../results";

/** Topaz accepts output dimensions up to 32,000 pixels per side. */
const MAX_DIMENSION = 32_000;

export const schema = {
  imageUrl: z
    .url({ protocol: /^https$/ })
    .describe("Public https URL of the image to upscale"),
  generative: z
    .boolean()
    .default(false)
    .describe(
      "Use Topaz's generative models, which add detail instead of only sharpening"
    ),
  model: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .optional()
    .describe(
      'Topaz model name, e.g. "Standard V2" or "High Fidelity V2"; generative: "Redefine" or "Recovery V2"'
    ),
  outputWidth: z.number().int().min(1).max(MAX_DIMENSION).optional(),
  outputHeight: z
    .number()
    .int()
    .min(1)
    .max(MAX_DIMENSION)
    .optional()
    .describe("Set one side to keep the aspect ratio"),
  outputFormat: z.enum(["jpeg", "png"]).default("jpeg"),
  cropToFill: z.boolean().default(false),
};

export const metadata: ToolMetadata = {
  name: "upscale-image",
  description:
    "Upscale and enhance an image with Topaz. Returns the result, or a jobId if it takes longer than about 50 seconds. Uses Topaz credits, billed by output megapixels.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function upscaleImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  try {
    return await settle(await submitUpscale(input, call), call);
  } catch (error) {
    return asToolError(error, call);
  }
}
