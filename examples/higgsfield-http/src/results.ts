import {
  getRequest,
  HiggsfieldError,
  TERMINAL,
  type HiggsfieldRequest,
} from "./higgsfield";
import {
  imagesResult,
  textResult,
  toolError,
  waitFor,
  type Call,
  type ToolResult,
  type WaitOptions,
} from "./jobs";

/** Waits for a request within the budget and turns it into a tool result. */
export async function settle(
  jobId: string,
  call: Call,
  options?: WaitOptions
): Promise<ToolResult> {
  const { settled, value } = await waitFor(
    () => getRequest(jobId, call),
    (request: HiggsfieldRequest) => TERMINAL.has(request.status),
    call,
    options
  );
  if (!settled)
    return textResult({
      jobId,
      status: value.status,
      message:
        "Still running. Call get-image-job with this jobId to check again.",
    });
  if (value.status === "completed")
    return imagesResult(
      { jobId, status: value.status },
      (value.images ?? []).map(({ url }) => ({
        url,
        ...(value.expires_at ? { expiresAt: value.expires_at } : {}),
      })),
      call
    );
  if (value.status === "nsfw")
    return toolError(
      `Higgsfield blocked job ${jobId} for content policy. It was not charged.`
    );
  if (value.status === "canceled")
    return toolError(`Higgsfield job ${jobId} was cancelled.`);
  return toolError(
    `Higgsfield job ${jobId} failed. Failed jobs are not charged.`
  );
}

export function asToolError(error: unknown, call: Call): ToolResult {
  call.signal.throwIfAborted();
  if (error instanceof HiggsfieldError) return toolError(error.message);
  return toolError(
    "Higgsfield could not be reached. Requests are not retried automatically."
  );
}
