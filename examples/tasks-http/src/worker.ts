import { store } from "./task-store";
import { processQueue, type Job } from "./queue";

/**
 * The worker: a process completely separate from the MCP server. It shares
 * nothing with the request that created the task except the on-disk queue and
 * task store. Run it in its own terminal (`pnpm worker`).
 */
async function run(job: Job) {
  // The delay simulates real work; its duration is caller-supplied job data,
  // not a fixed timer.
  await new Promise((resolve) => setTimeout(resolve, job.seconds * 1000));

  // Store a plain string: xmcp coerces it into a CallToolResult when the client
  // reads it back, just like returning a string from a normal tool.
  await store.storeTaskResult(
    job.taskId,
    "completed",
    `Job "${job.label}" finished after ${job.seconds}s.`
  );
}

void processQueue(run);
