import {
  getDownload,
  getStatus,
  TERMINAL,
  TopazError,
  type TopazStatus,
} from "./topaz";
import {
  hitDeadline,
  imagesResult,
  textResult,
  toolError,
  waitFor,
  type Call,
  type ToolResult,
  type WaitOptions,
} from "./jobs";

/** Waits for an upscale within the budget and turns it into a tool result. */
export async function settle(
  jobId: string,
  call: Call,
  options?: WaitOptions
): Promise<ToolResult> {
  const { settled, value } = await waitFor(
    () => getStatus(jobId, call),
    (job: TopazStatus) => TERMINAL.has(job.status),
    call,
    options,
    (job) => job.progress ?? undefined
  );
  if (!settled)
    return textResult({
      jobId,
      status: value.status,
      progress: value.progress ?? null,
      message:
        "Still running. Call get-upscale-job with this jobId to check again.",
    });
  if (value.status === "Completed") {
    const summary = {
      jobId,
      status: value.status,
      width: value.output_width ?? null,
      height: value.output_height ?? null,
      credits: value.credits ?? null,
    };
    let download: Awaited<ReturnType<typeof getDownload>>;
    try {
      download = await getDownload(jobId, call);
    } catch (error) {
      if (!hitDeadline(error, call)) throw error;
      return textResult({
        ...summary,
        message:
          "Finished, but the call ran out of time before the download link. Call get-upscale-job with this jobId to get the image.",
      });
    }
    return imagesResult(summary, [download], call);
  }
  if (value.status === "Cancelled")
    return toolError(`Topaz job ${jobId} was cancelled.`);
  return toolError(
    `Topaz job ${jobId} failed. Service-side failures are refunded.`
  );
}

export function asToolError(error: unknown, call: Call): ToolResult {
  call.signal.throwIfAborted();
  if (error instanceof TopazError) return toolError(error.message);
  return toolError(
    "Topaz could not be reached. Requests are not retried automatically."
  );
}

/**
 * After a submission the job exists and is billed, so a failure while waiting
 * or downloading still hands back its jobId for get-upscale-job.
 */
export function resumable(
  error: unknown,
  call: Call,
  jobId: string
): ToolResult {
  call.signal.throwIfAborted();
  return textResult({
    jobId,
    status: "unknown",
    message: `${error instanceof TopazError ? error.message : "Topaz could not be reached."} The job was submitted; call get-upscale-job with this jobId to check it.`,
  });
}
