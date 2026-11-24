import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { submitGeneration } from "../krea";
import { asToolError, settle } from "../results";

export const schema = {
  prompt: z.string().trim().min(1).max(4000),
  imageUrls: z
    .array(z.url({ protocol: /^https$/ }))
    .max(8)
    .optional()
    .describe("Reference or source images to edit; public https URLs"),
  aspectRatio: z
    .enum([
      "1:1",
      "4:5",
      "3:4",
      "2:3",
      "9:16",
      "5:4",
      "4:3",
      "3:2",
      "16:9",
      "21:9",
    ])
    .default("1:1"),
  resolution: z.enum(["1K", "2K", "4K"]).default("1K"),
  thinkingMode: z
    .enum(["fast", "high"])
    .default("fast")
    .describe("high reasons longer about the prompt and costs more"),
  seed: z.number().int().optional(),
  negativePrompt: z.string().max(1024).optional(),
};

export const metadata: ToolMetadata = {
  name: "generate-image",
  description:
    "Generate or edit an image with Krea 3. Returns the image, or a jobId if it takes longer than about 50 seconds. Uses the server's Krea API balance.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function generateImage(input: InferSchema<typeof schema>) {
  const call = getRequestContext();
  try {
    return await settle(await submitGeneration(input, call), call);
  } catch (error) {
    return asToolError(error, call);
  }
}
