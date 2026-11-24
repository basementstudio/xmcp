import { setTimeout as sleep } from "node:timers/promises";
import { image } from "xmcp";

/** Providers recommend polling every 2–5 seconds. */
export const POLL_INTERVAL_MS = 2_000;
/**
 * Each call answers within this budget, measured from when the tool starts, to
 * stay under the ~60 s request timeout many MCP clients use. Submission,
 * polling, and the result download all share it. Jobs that run longer return
 * their job ID so the client can check back later.
 */
export const WAIT_BUDGET_MS = 50_000;
/** Bounds each individual provider request, within what is left of the budget. */
export const REQUEST_TIMEOUT_MS = 30_000;
/** Larger outputs are returned as a link instead of inline image content. */
export const MAX_INLINE_IMAGE_BYTES = 8 * 1024 * 1024;

/** The parts of the MCP request a long-running tool needs. */
export interface Call {
  signal: AbortSignal;
  progress?: (value: number, total?: number) => Promise<void>;
  /** Epoch milliseconds by which the tool must answer. */
  deadline?: number;
}

/** Starts the wait budget when the tool starts. */
export function startCall(context: Call): Call {
  return {
    signal: context.signal,
    progress: context.progress,
    deadline: Date.now() + WAIT_BUDGET_MS,
  };
}

export interface WaitOptions {
  pollIntervalMs?: number;
  waitBudgetMs?: number;
}

/** Reports provider progress as a percentage when it is known. */
export type Measure<T> = (value: T) => number | undefined;

/**
 * Polls until `done` returns true or the call's budget runs out. Progress is
 * only reported when it increases, as MCP requires. Cancelling the MCP request
 * stops waiting; it does not cancel the provider job.
 */
export async function waitFor<T>(
  poll: () => Promise<T>,
  done: (value: T) => boolean,
  call: Call,
  options: WaitOptions = {},
  measure?: Measure<T>
): Promise<{ settled: boolean; value: T }> {
  const interval = options.pollIntervalMs ?? POLL_INTERVAL_MS;
  const deadline =
    options.waitBudgetMs !== undefined
      ? Date.now() + options.waitBudgetMs
      : (call.deadline ?? Date.now() + WAIT_BUDGET_MS);
  let reported = 0;
  for (let step = 1; ; step++) {
    call.signal.throwIfAborted();
    const value = await poll();
    if (done(value)) return { settled: true, value };
    if (Date.now() + interval > deadline) return { settled: false, value };
    const next = measure ? measure(value) : step;
    if (next !== undefined && next > reported) {
      reported = next;
      await call.progress?.(next, measure ? 100 : undefined);
    }
    await sleep(interval, undefined, { signal: call.signal });
  }
}

/** Aborts a provider request on cancellation, its own timeout, or the call's deadline. */
export function requestSignal(call: Call): AbortSignal {
  const remaining =
    call.deadline === undefined
      ? REQUEST_TIMEOUT_MS
      : Math.min(REQUEST_TIMEOUT_MS, Math.max(0, call.deadline - Date.now()));
  return AbortSignal.any([call.signal, AbortSignal.timeout(remaining)]);
}

export type ToolResult = {
  isError?: true;
  content: ({ type: "text"; text: string } | ReturnType<typeof image>)[];
};

/**
 * Status results share a tool with image results, so they can't declare an
 * outputSchema; they return their JSON as text content instead.
 */
export function textResult(value: Record<string, unknown>): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(value) }] };
}

export function toolError(message: string): ToolResult {
  return { isError: true, content: [{ type: "text", text: message }] };
}

export interface Output {
  url?: string;
  bytes?: Uint8Array;
  mimeType?: string;
  expiresAt?: string;
}

/**
 * Downloads a provider result URL. Result links are pre-signed, so no provider
 * credential is sent. Only https URLs are fetched, and the size is capped.
 */
export async function download(
  url: string,
  call: Call
): Promise<{ bytes: Uint8Array; mimeType: string } | undefined> {
  if (new URL(url).protocol !== "https:") return undefined;
  const response = await fetch(url, { signal: requestSignal(call) });
  const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "";
  const length = Number(response.headers.get("content-length") ?? 0);
  if (!response.ok || !mimeType.startsWith("image/")) return undefined;
  if (length > MAX_INLINE_IMAGE_BYTES) return undefined;
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_INLINE_IMAGE_BYTES) return undefined;
  return { bytes, mimeType };
}

/**
 * Returns finished images inline when they fit, plus a JSON summary with each
 * provider link and its expiry, so clients can still fetch large outputs.
 */
export async function imagesResult(
  summary: Record<string, unknown>,
  outputs: Output[],
  call: Call
): Promise<ToolResult> {
  const content: ToolResult["content"] = [];
  const links: { url?: string; expiresAt?: string; inline: boolean }[] = [];
  for (const output of outputs) {
    const file =
      output.bytes && output.mimeType
        ? { bytes: output.bytes, mimeType: output.mimeType }
        : output.url
          ? await download(output.url, call).catch(() => undefined)
          : undefined;
    // Bytes a provider returned directly have no link to fall back on.
    if (
      file &&
      (output.bytes || file.bytes.byteLength <= MAX_INLINE_IMAGE_BYTES)
    )
      content.push(image(file.bytes, file.mimeType));
    links.push({
      ...(output.url ? { url: output.url } : {}),
      ...(output.expiresAt ? { expiresAt: output.expiresAt } : {}),
      inline: Boolean(file),
    });
  }
  content.unshift({
    type: "text",
    text: JSON.stringify({ ...summary, images: links }),
  });
  return { content };
}
