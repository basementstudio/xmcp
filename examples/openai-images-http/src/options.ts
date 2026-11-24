import { z } from "zod";
import {
  imagesResult,
  toolError,
  type Call,
  type Output,
  type ToolResult,
} from "./jobs";
import { OpenAIImageError } from "./openai";

/** Bounds how many images one call returns inline. */
const MAX_IMAGES = 4;

export const imageOptions = {
  size: z.enum(["auto", "1024x1024", "1536x1024", "1024x1536"]).default("auto"),
  quality: z.enum(["auto", "low", "medium", "high"]).default("auto"),
  background: z
    .enum(["auto", "opaque", "transparent"])
    .default("auto")
    .describe("transparent needs png or webp output"),
  outputFormat: z.enum(["png", "webp", "jpeg"]).default("png"),
  n: z.number().int().min(1).max(MAX_IMAGES).default(1),
};

export async function respond(
  outputs: () => Promise<Output[]>,
  call: Call
): Promise<ToolResult> {
  try {
    const images = await outputs();
    return imagesResult({ count: images.length }, images, call);
  } catch (error) {
    call.signal.throwIfAborted();
    if (error instanceof OpenAIImageError) return toolError(error.message);
    return toolError(
      "OpenAI could not be reached or timed out. Requests are not retried automatically; a timeout does not guarantee the images were not billed."
    );
  }
}
