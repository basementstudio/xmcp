import { z } from "zod";
import { imagesResult, toolError, type Call, type ToolResult } from "./jobs";
import { createImage, GeminiImageError, type GeminiInput } from "./gemini";

export const imageOptions = {
  aspectRatio: z
    .enum([
      "1:1",
      "2:3",
      "3:2",
      "3:4",
      "4:3",
      "4:5",
      "5:4",
      "9:16",
      "16:9",
      "21:9",
    ])
    .optional()
    .describe(
      "Defaults to the model's choice, or the source image's ratio when editing"
    ),
  imageSize: z.enum(["1K", "2K", "4K"]).default("1K"),
};

export async function respond(
  input: GeminiInput,
  call: Call
): Promise<ToolResult> {
  try {
    const outputs = await createImage(input, call);
    return imagesResult({ count: outputs.length }, outputs, call);
  } catch (error) {
    call.signal.throwIfAborted();
    if (error instanceof GeminiImageError) return toolError(error.message);
    return toolError(
      "Gemini could not be reached or timed out. Requests are not retried automatically; a timeout does not guarantee the image was not billed."
    );
  }
}
