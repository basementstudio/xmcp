import { z } from "zod";
import type { Call, Output } from "./jobs";

const BASE_URL = "https://api.openai.com/v1/images";
const DEFAULT_MODEL = "gpt-image-2.6-flare";
/**
 * OpenAI returns images in the same response, and high-quality images can take
 * over a minute. Some MCP clients give up sooner; raise their timeout if needed.
 */
export const IMAGE_REQUEST_TIMEOUT_MS = 120_000;

export class OpenAIImageError extends Error {}

const images = z.object({
  data: z.array(z.object({ b64_json: z.string() })).min(1),
  output_format: z.string().optional(),
});

function apiKey(): string {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key)
    throw new OpenAIImageError("Set OPENAI_API_KEY before using this server.");
  return key;
}

function model(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
}

function failure(status: number): OpenAIImageError {
  if (status === 400)
    return new OpenAIImageError(
      "OpenAI rejected the request. The prompt or image may have been blocked by moderation."
    );
  if (status === 401)
    return new OpenAIImageError("OpenAI rejected the API key.");
  if (status === 403)
    return new OpenAIImageError(
      "The OpenAI organization cannot use this model. Some image models require organization verification."
    );
  if (status === 429)
    return new OpenAIImageError(
      "OpenAI rate limit or quota reached. Try again later."
    );
  return new OpenAIImageError(`OpenAI returned HTTP ${status}.`);
}

export interface ImageOptions {
  size: string;
  quality: string;
  background: string;
  outputFormat: string;
  n: number;
}

async function create(
  path: string,
  body: Record<string, unknown>,
  call: Call
): Promise<Output[]> {
  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: model(), ...body }),
    redirect: "error",
    signal: AbortSignal.any([
      call.signal,
      AbortSignal.timeout(IMAGE_REQUEST_TIMEOUT_MS),
    ]),
  });
  if (!response.ok) throw failure(response.status);
  const parsed = images.safeParse(await response.json());
  if (!parsed.success) throw new OpenAIImageError("OpenAI returned no image.");
  const format = parsed.data.output_format ?? String(body.output_format);
  return parsed.data.data.map(({ b64_json }) => ({
    bytes: Buffer.from(b64_json, "base64"),
    mimeType: `image/${format === "jpeg" ? "jpeg" : format}`,
  }));
}

function options(input: ImageOptions) {
  return {
    size: input.size,
    quality: input.quality,
    background: input.background,
    output_format: input.outputFormat,
    n: input.n,
  };
}

/** One request, never retried: a retry would bill a second set of images. */
export function generate(prompt: string, input: ImageOptions, call: Call) {
  return create("generations", { prompt, ...options(input) }, call);
}

export function edit(
  prompt: string,
  imageUrls: string[],
  maskUrl: string | undefined,
  input: ImageOptions,
  call: Call
) {
  return create(
    "edits",
    {
      prompt,
      images: imageUrls.map((image_url) => ({ image_url })),
      ...(maskUrl ? { mask: { image_url: maskUrl } } : {}),
      ...options(input),
    },
    call
  );
}
