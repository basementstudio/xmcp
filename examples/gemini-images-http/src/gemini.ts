import type { Call, Output } from "./jobs";

const ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/interactions";
const DEFAULT_MODEL = "gemini-nano-banana-2.1";
/** Gemini returns images in the same response; larger images take longer. */
export const IMAGE_REQUEST_TIMEOUT_MS = 120_000;

export class GeminiImageError extends Error {}

export interface SourceImage {
  data: string;
  mimeType: string;
}

export interface GeminiInput {
  prompt: string;
  images?: SourceImage[];
  aspectRatio?: string;
  imageSize: string;
}

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key)
    throw new GeminiImageError("Set GEMINI_API_KEY before using this server.");
  return key;
}

function failure(status: number): GeminiImageError {
  if (status === 400)
    return new GeminiImageError(
      "Gemini rejected the request. Check the prompt, images, and size options."
    );
  if (status === 401 || status === 403)
    return new GeminiImageError("Gemini rejected the API key.");
  if (status === 429)
    return new GeminiImageError(
      "Gemini rate limit or quota reached. Try again later."
    );
  return new GeminiImageError(`Gemini returned HTTP ${status}.`);
}

/** Identifies common image formats when a block carries no MIME type. */
function sniff(bytes: Uint8Array): string {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return "image/png";
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes[0] === 0x52 && bytes[8] === 0x57) return "image/webp";
  return "image/png";
}

type Block = { type?: unknown; data?: unknown; mime_type?: unknown };

/** Collects image blocks from the interaction's model output steps. */
function images(body: unknown): Output[] {
  const steps = (body as { steps?: unknown })?.steps;
  if (!Array.isArray(steps)) return [];
  const outputs: Output[] = [];
  for (const step of steps as { type?: unknown; content?: unknown }[]) {
    if (step?.type !== "model_output" || !Array.isArray(step.content)) continue;
    for (const block of step.content as Block[]) {
      if (block?.type !== "image" || typeof block.data !== "string") continue;
      const bytes = Buffer.from(block.data, "base64");
      outputs.push({
        bytes,
        mimeType:
          typeof block.mime_type === "string" ? block.mime_type : sniff(bytes),
      });
    }
  }
  return outputs;
}

/** Sends one interaction, never retried: a retry would bill a second image. */
export async function createImage(
  input: GeminiInput,
  call: Call
): Promise<Output[]> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-goog-api-key": apiKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL,
      input: [
        { type: "text", text: input.prompt },
        ...(input.images ?? []).map((image) => ({
          type: "image",
          mime_type: image.mimeType,
          data: image.data,
        })),
      ],
      response_format: {
        type: "image",
        image_size: input.imageSize,
        ...(input.aspectRatio ? { aspect_ratio: input.aspectRatio } : {}),
      },
    }),
    redirect: "error",
    signal: AbortSignal.any([
      call.signal,
      AbortSignal.timeout(IMAGE_REQUEST_TIMEOUT_MS),
    ]),
  });
  if (!response.ok) throw failure(response.status);
  const outputs = images(await response.json());
  if (!outputs.length)
    throw new GeminiImageError(
      "Gemini returned no image. The prompt may have been declined."
    );
  return outputs;
}
