import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requestSignal, type Call } from "./jobs";

const BASE_URL = "https://api.higgsfield.ai";
/** Text to image with Higgsfield's own Soul model. */
export const GENERATE_PATH = "/higgsfield-ai/soul/v2/standard";
/** Grok Image 2.0 on Higgsfield edits from up to 10 source images. */
export const EDIT_PATH = "/xai/grok-imagine-image-2.0";

export class HiggsfieldError extends Error {}

const submitted = z.object({ request_id: z.string().min(1) });
const request = z.object({
  status: z.string(),
  images: z.array(z.object({ url: z.string() })).nullish(),
  expires_at: z.string().nullish(),
});
export type HiggsfieldRequest = z.infer<typeof request>;

export const TERMINAL = new Set(["completed", "failed", "nsfw", "canceled"]);

function authorization(): string {
  const id = process.env.HIGGSFIELD_API_KEY_ID?.trim();
  const secret = process.env.HIGGSFIELD_API_KEY_SECRET?.trim();
  if (!id || !secret)
    throw new HiggsfieldError(
      "Set HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET before using this server."
    );
  return `Key ${id}:${secret}`;
}

function failure(status: number): HiggsfieldError {
  if (status === 401)
    return new HiggsfieldError("Higgsfield rejected the API key.");
  if (status === 403)
    return new HiggsfieldError(
      "Higgsfield refused the request: the account balance is too low."
    );
  if (status === 404)
    return new HiggsfieldError("Higgsfield has no request with that ID.");
  if (status === 400 || status === 422)
    return new HiggsfieldError("Higgsfield rejected the request parameters.");
  if (status === 429)
    return new HiggsfieldError(
      "Higgsfield's queue for this account is full. Try again later."
    );
  if (status === 423 || status === 503)
    return new HiggsfieldError(
      "This Higgsfield model is temporarily unavailable."
    );
  return new HiggsfieldError(`Higgsfield returned HTTP ${status}.`);
}

async function send(path: string, init: RequestInit, call: Call) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: authorization(),
      Accept: "application/json",
      ...(init.body
        ? {
            "Content-Type": "application/json",
            // Lets Higgsfield deduplicate this submission; it is still sent only once.
            "Idempotency-Key": randomUUID(),
          }
        : {}),
    },
    redirect: "error",
    signal: requestSignal(call),
  });
  if (!response.ok) throw failure(response.status);
  return response;
}

/** Submits a generation or edit once and returns its request ID. */
export async function submit(
  path: string,
  body: Record<string, unknown>,
  call: Call
): Promise<string> {
  const response = await send(
    path,
    { method: "POST", body: JSON.stringify(body) },
    call
  );
  const parsed = submitted.safeParse(await response.json());
  if (!parsed.success)
    throw new HiggsfieldError("Higgsfield returned no request ID.");
  return parsed.data.request_id;
}

export async function getRequest(
  requestId: string,
  call: Call
): Promise<HiggsfieldRequest> {
  const response = await send(
    `/requests/${encodeURIComponent(requestId)}/status`,
    { method: "GET" },
    call
  );
  const parsed = request.safeParse(await response.json());
  if (!parsed.success)
    throw new HiggsfieldError("Higgsfield returned an unexpected status.");
  return parsed.data;
}

/** Higgsfield only cancels requests that are still queued. */
export async function cancelRequest(
  requestId: string,
  call: Call
): Promise<void> {
  await send(
    `/requests/${encodeURIComponent(requestId)}/cancel`,
    { method: "POST" },
    call
  );
}
