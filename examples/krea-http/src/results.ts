import { getJob, KreaError, TERMINAL, type KreaJob } from "./krea";
import {
  imagesResult,
  textResult,
  toolError,
  waitFor,
  type Call,
  type ToolResult,
  type WaitOptions,
} from "./jobs";

/** Waits for a job within the request budget and turns it into a tool result. */
export async function settle(
  jobId: string,
  call: Call,
  options?: WaitOptions
): Promise<ToolResult> {
  const { settled, value } = await waitFor(
    () => getJob(jobId, call),
    (job: KreaJob) => TERMINAL.has(job.status),
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
      (value.result?.urls ?? []).map((url) => ({ url })),
      call
    );
  if (value.status === "cancelled")
    return toolError(`Krea job ${jobId} was cancelled.`);
  return toolError(
    `Krea job ${jobId} failed (${value.error?.code ?? "unknown"}). Failed jobs are not billed.`
  );
}

export function asToolError(error: unknown, call: Call): ToolResult {
  call.signal.throwIfAborted();
  if (error instanceof KreaError) return toolError(error.message);
  return toolError(
    "Krea could not be reached. Requests are not retried automatically."
  );
}
