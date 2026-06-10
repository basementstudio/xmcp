import { promises as fs } from "node:fs";
import { watch } from "node:fs";
import path from "node:path";

/**
 * A tiny filesystem job queue: the explicit boundary between the tool (which
 * only *enqueues* work) and the worker (which *executes* it, in a separate
 * process). The tool and the worker never share memory — only these job files
 * and the task store on disk. This mirrors the real serverless shape: an HTTP
 * function drops a job on a queue, and a separate worker/cron picks it up.
 */
export interface Job {
  taskId: string;
  label: string;
  seconds: number;
}

const dir = path.resolve(process.cwd(), ".queue");
const file = (taskId: string) => path.join(dir, `${taskId}.json`);

/** Drop a job on the queue. Called by the tool; returns immediately. */
export async function enqueue(job: Job): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(file(job.taskId), JSON.stringify(job), "utf-8");
}

/** Read a job and remove it from the queue so it runs at most once. */
async function claimJob(taskId: string): Promise<Job | null> {
  try {
    const raw = await fs.readFile(file(taskId), "utf-8");
    await fs.rm(file(taskId), { force: true });
    return JSON.parse(raw) as Job;
  } catch {
    return null;
  }
}

async function pendingTaskIds(): Promise<string[]> {
  try {
    return (await fs.readdir(dir))
      .filter((n) => n.endsWith(".json"))
      .map((n) => n.slice(0, -".json".length));
  } catch {
    return [];
  }
}

/**
 * Watch the queue and run `onJob` for each job exactly once. Signal-based: it
 * drains anything already queued on startup, then reacts to `fs.watch` events
 * for new jobs — no polling timer.
 */
export async function watchQueue(
  onJob: (job: Job) => Promise<void>
): Promise<void> {
  await fs.mkdir(dir, { recursive: true });

  const run = async (taskId: string) => {
    const job = await claimJob(taskId);
    if (job) await onJob(job);
  };

  for (const taskId of await pendingTaskIds()) {
    await run(taskId);
  }

  watch(dir, (_event, filename) => {
    if (filename && filename.endsWith(".json")) {
      void run(filename.slice(0, -".json".length));
    }
  });
}
