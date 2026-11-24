import { BflError, poll, RUNNING, type BflResult } from "./bfl";
import {
  imagesResult,
  textResult,
  toolError,
  waitFor,
  type Call,
  type ToolResult,
  type WaitOptions,
} from "./jobs";

/** BFL result links stop working ten minutes after the task finishes. */
const RESULT_LINK_LIFETIME_MS = 10 * 60 * 1000;

export async function settle(
  pollingUrl: string,
  call: Call,
  options?: WaitOptions
): Promise<ToolResult> {
  const { settled, value } = await waitFor(
    () => poll(pollingUrl, call),
    (task: BflResult) => !RUNNING.has(task.status),
    call,
    options
  );
  if (!settled)
    return textResult({
      pollingUrl,
      status: value.status,
      message:
        "Still running. Call get-image-job with this pollingUrl to check again.",
    });
  if (value.status === "Ready" && value.result)
    return imagesResult(
      { pollingUrl, status: value.status },
      [
        {
          url: value.result.sample,
          expiresAt: new Date(
            Date.now() + RESULT_LINK_LIFETIME_MS
          ).toISOString(),
        },
      ],
      call
    );
  if (value.status.includes("Moderated"))
    return toolError(
      `Black Forest Labs moderated this request (${value.status}).`
    );
  return toolError(
    `Black Forest Labs did not produce an image (${value.status}).`
  );
}

export function asToolError(error: unknown, call: Call): ToolResult {
  call.signal.throwIfAborted();
  if (error instanceof BflError) return toolError(error.message);
  return toolError(
    "Black Forest Labs could not be reached. Requests are not retried automatically."
  );
}
