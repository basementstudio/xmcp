import { z } from "zod";
import { requestSignal, type Call } from "./jobs";

const BASE_URL = "https://api.krea.ai";

export class KreaError extends Error {}

const submitted = z.object({ job_id: z.string().min(1) });
const job = z.object({
  job_id: z.string(),
  status: z.string(),
  result: z.object({ urls: z.array(z.string()) }).nullish(),
  error: z
    .object({ code: z.string(), message: z.string().optional() })
    .nullish(),
});
export type KreaJob = z.infer<typeof job>;

export const TERMINAL = new Set(["completed", "failed", "cancelled"]);

function apiKey(): string {
  const key = process.env.KREA_API_KEY?.trim();
  if (!key) throw new KreaError("Set KREA_API_KEY before using this server.");
  return key;
}

// Krea returns plain messages for known account problems; anything else is generic.
function failure(status: number): KreaError {
  if (status === 401) return new KreaError("Krea rejected the API key.");
  if (status === 402)
    return new KreaError(
      "Krea refused the job: the API balance is empty or the plan does not include this option."
    );
  if (status === 404) return new KreaError("Krea has no job with that ID.");
  if (status === 422)
    return new KreaError("Krea rejected the request parameters.");
  if (status === 429)
    return new KreaError(
      "Krea's concurrency limit is reached. Try again later."
    );
  return new KreaError(`Krea returned HTTP ${status}.`);
}

async function request(path: string, init: RequestInit, call: Call) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
    redirect: "error",
    signal: requestSignal(call),
  });
  if (!response.ok) throw failure(response.status);
  return response;
}

export interface GenerateInput {
  prompt: string;
  imageUrls?: string[];
  aspectRatio: string;
  resolution: string;
  thinkingMode: string;
  seed?: number;
  negativePrompt?: string;
}

/** Submits a Krea 3 job once. Submissions are never retried. */
export async function submitGeneration(
  input: GenerateInput,
  call: Call
): Promise<string> {
  const response = await request(
    "/generate/image/krea/krea-3",
    {
      method: "POST",
      body: JSON.stringify({
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
        resolution: input.resolution,
        thinking_mode: input.thinkingMode,
        ...(input.imageUrls?.length ? { image_urls: input.imageUrls } : {}),
        ...(input.seed === undefined ? {} : { seed: input.seed }),
        ...(input.negativePrompt
          ? { negative_prompt: input.negativePrompt }
          : {}),
      }),
    },
    call
  );
  const parsed = submitted.safeParse(await response.json());
  if (!parsed.success) throw new KreaError("Krea returned no job ID.");
  return parsed.data.job_id;
}

export async function getJob(jobId: string, call: Call): Promise<KreaJob> {
  const response = await request(
    `/jobs/${encodeURIComponent(jobId)}`,
    { method: "GET" },
    call
  );
  const parsed = job.safeParse(await response.json());
  if (!parsed.success) throw new KreaError("Krea returned an unexpected job.");
  return parsed.data;
}

export async function cancelJob(jobId: string, call: Call): Promise<void> {
  await request(
    `/jobs/${encodeURIComponent(jobId)}`,
    { method: "DELETE" },
    call
  );
}
