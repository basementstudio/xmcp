import { z } from "zod";
import { requestSignal, type Call } from "./jobs";

const BASE_URL = "https://api.topazlabs.com/image/v1";
/** Topaz's documented defaults for the two upscale families. */
export const DEFAULT_MODEL = {
  standard: "Standard V2",
  generative: "Redefine",
};

export class TopazError extends Error {}

const submitted = z.object({ process_id: z.string().min(1) });
const status = z.object({
  status: z.enum(["Pending", "Processing", "Completed", "Cancelled", "Failed"]),
  progress: z.number().nullish(),
  output_width: z.number().nullish(),
  output_height: z.number().nullish(),
  credits: z.number().nullish(),
});
export type TopazStatus = z.infer<typeof status>;
const download = z.object({ download_url: z.string(), expiry: z.number() });

export const TERMINAL = new Set(["Completed", "Cancelled", "Failed"]);

function apiKey(): string {
  const key = process.env.TOPAZ_API_KEY?.trim();
  if (!key) throw new TopazError("Set TOPAZ_API_KEY before using this server.");
  return key;
}

function failure(code: number): TopazError {
  if (code === 401) return new TopazError("Topaz rejected the API key.");
  if (code === 402)
    return new TopazError(
      "The Topaz account has too few credits for this job."
    );
  if (code === 404)
    return new TopazError(
      "Topaz has no job with that ID, or it is older than 7 days."
    );
  if (code === 409)
    return new TopazError("That Topaz job is not in a state that allows this.");
  if (code === 412)
    return new TopazError("The Topaz account has no active API subscription.");
  if (code === 400 || code === 413 || code === 415 || code === 422)
    return new TopazError("Topaz rejected the image or the output settings.");
  if (code === 429)
    return new TopazError("Topaz rate limit reached. Try again later.");
  return new TopazError(`Topaz returned HTTP ${code}.`);
}

async function send(path: string, init: RequestInit, call: Call) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey(),
      Accept: "application/json",
      // Topaz's edge rejects requests without a descriptive user agent.
      "User-Agent": "xmcp-topaz-example",
    },
    redirect: "error",
    signal: requestSignal(call),
  });
  if (!response.ok) throw failure(response.status);
  return response;
}

export interface UpscaleInput {
  imageUrl: string;
  generative: boolean;
  model?: string;
  outputWidth?: number;
  outputHeight?: number;
  outputFormat: string;
  cropToFill: boolean;
}

/** Submits one enhance job. Topaz fetches the image from its public URL. */
export async function submitUpscale(
  input: UpscaleInput,
  call: Call
): Promise<string> {
  const form = new FormData();
  form.set("source_url", input.imageUrl);
  form.set(
    "model",
    input.model ?? DEFAULT_MODEL[input.generative ? "generative" : "standard"]
  );
  form.set("output_format", input.outputFormat);
  form.set("crop_to_fill", String(input.cropToFill));
  if (input.outputWidth) form.set("output_width", String(input.outputWidth));
  if (input.outputHeight) form.set("output_height", String(input.outputHeight));
  const response = await send(
    input.generative ? "/enhance-gen/async" : "/enhance/async",
    { method: "POST", body: form },
    call
  );
  const parsed = submitted.safeParse(await response.json());
  if (!parsed.success) throw new TopazError("Topaz returned no process ID.");
  return parsed.data.process_id;
}

export async function getStatus(
  processId: string,
  call: Call
): Promise<TopazStatus> {
  const response = await send(
    `/status/${encodeURIComponent(processId)}`,
    { method: "GET" },
    call
  );
  const parsed = status.safeParse(await response.json());
  if (!parsed.success)
    throw new TopazError("Topaz returned an unexpected status.");
  return parsed.data;
}

/** Download links are fresh for one hour each time they are requested. */
export async function getDownload(processId: string, call: Call) {
  const response = await send(
    `/download/${encodeURIComponent(processId)}`,
    { method: "GET" },
    call
  );
  const parsed = download.safeParse(await response.json());
  if (!parsed.success) throw new TopazError("Topaz returned no download link.");
  return {
    url: parsed.data.download_url,
    expiresAt: new Date(parsed.data.expiry * 1000).toISOString(),
  };
}

export async function cancel(processId: string, call: Call): Promise<void> {
  await send(
    `/cancel/${encodeURIComponent(processId)}`,
    { method: "DELETE" },
    call
  );
}
