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
      // Links expire ten minutes after the task finished; BFL reports no finish time.
      [{ url: value.result.sample }],
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

/**
 * After a submission the job exists and is billed, so a failure while waiting
 * or downloading still hands back its pollingUrl for get-image-job.
 */
export function resumable(
  error: unknown,
  call: Call,
  pollingUrl: string
): ToolResult {
  call.signal.throwIfAborted();
  return textResult({
    pollingUrl,
    status: "unknown",
    message: `${error instanceof BflError ? error.message : "Black Forest Labs could not be reached."} The job was submitted; call get-image-job with this pollingUrl to check it.`,
  });
}
