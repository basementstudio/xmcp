import { z } from "zod";
import { requestSignal, type Call } from "./jobs";

const BASE_URL = "https://api.bfl.ai/v1";
/** FLUX.2 [pro] generates from text and edits when input images are set. */
const DEFAULT_MODEL = "flux-2-pro";
/** Statuses that mean the task is still running; anything else is final. */
export const RUNNING = new Set([
  "Pending",
  "Queued",
  "Reasoning",
  "Generating",
]);

export class BflError extends Error {}

const submitted = z.object({
  id: z.string().min(1),
  polling_url: z.string(),
  cost: z.number().nullish(),
});
const result = z.object({
  id: z.string().optional(),
  status: z.string(),
  result: z.object({ sample: z.string() }).nullish(),
});
export type BflResult = z.infer<typeof result>;

function apiKey(): string {
  const key = process.env.BFL_API_KEY?.trim();
  if (!key) throw new BflError("Set BFL_API_KEY before using this server.");
  return key;
}

function model(): string {
  const name = process.env.BFL_MODEL?.trim() || DEFAULT_MODEL;
  if (!/^[a-z0-9.-]+$/.test(name))
    throw new BflError("BFL_MODEL is not a valid model path.");
  return name;
}

/**
 * Only BFL's own result endpoints are polled, so the x-key credential is never
 * sent to a URL a client supplied for another host.
 */
export function assertPollingUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    !(url.hostname === "bfl.ai" || url.hostname.endsWith(".bfl.ai")) ||
    url.pathname !== "/v1/get_result" ||
    url.username ||
    url.password
  )
    throw new BflError("That is not a Black Forest Labs polling URL.");
  return url;
}

function failure(status: number): BflError {
  if (status === 401 || status === 403)
    return new BflError("Black Forest Labs rejected the API key.");
  if (status === 402)
    return new BflError("The Black Forest Labs account is out of credits.");
  if (status === 422)
    return new BflError("Black Forest Labs rejected the request parameters.");
  if (status === 429)
    return new BflError(
      "Black Forest Labs' limit of active tasks is reached. Try again later."
    );
  return new BflError(`Black Forest Labs returned HTTP ${status}.`);
}

async function send(url: string, init: RequestInit, call: Call) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "x-key": apiKey(),
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    redirect: "error",
    signal: requestSignal(call),
  });
  if (!response.ok) throw failure(response.status);
  return response;
}

export interface FluxInput {
  prompt: string;
  imageUrls?: string[];
  width?: number;
  height?: number;
  seed?: number;
  safetyTolerance: number;
  outputFormat: string;
}

/** Submits one FLUX task and returns its polling URL. */
export async function submit(input: FluxInput, call: Call): Promise<string> {
  // FLUX.2 takes source images as input_image, input_image_2 … input_image_8.
  const images = Object.fromEntries(
    (input.imageUrls ?? []).map((url, index) => [
      index === 0 ? "input_image" : `input_image_${index + 1}`,
      url,
    ])
  );
  const response = await send(
    `${BASE_URL}/${model()}`,
    {
      method: "POST",
      body: JSON.stringify({
        prompt: input.prompt,
        ...images,
        ...(input.width ? { width: input.width } : {}),
        ...(input.height ? { height: input.height } : {}),
        ...(input.seed === undefined ? {} : { seed: input.seed }),
        safety_tolerance: input.safetyTolerance,
        output_format: input.outputFormat,
      }),
    },
    call
  );
  const parsed = submitted.safeParse(await response.json());
  if (!parsed.success)
    throw new BflError("Black Forest Labs returned no polling URL.");
  return assertPollingUrl(parsed.data.polling_url).toString();
}

export async function poll(pollingUrl: string, call: Call): Promise<BflResult> {
  const response = await send(
    assertPollingUrl(pollingUrl).toString(),
    { method: "GET" },
    call
  );
  const parsed = result.safeParse(await response.json());
  if (!parsed.success)
    throw new BflError("Black Forest Labs returned an unexpected result.");
  return parsed.data;
}
