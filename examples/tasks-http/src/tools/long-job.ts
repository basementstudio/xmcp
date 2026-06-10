import { z } from "zod";
import {
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";
import { store } from "../task-store";

export const schema = {
  label: z.string().describe("A label for the job"),
  seconds: z
    .number()
    .min(1)
    .max(30)
    .default(3)
    .describe("How long the simulated job runs"),
};

export const metadata: ToolMetadata = {
  name: "long_job",
  description:
    "Runs a long job as an MCP task. The call returns immediately with a task; " +
    "poll tasks/get for status and tasks/result for the final output.",
  // Require task augmentation: clients must call this tool with a `task` field.
  // This is the right choice for async work that completes out-of-band, so the
  // server never blocks waiting for a result it cannot produce synchronously.
  taskSupport: "required",
  annotations: {
    title: "Long job",
    readOnlyHint: true,
  },
};

export default async function longJob(
  { label, seconds }: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const taskId = extra.task?.taskId;

  // Kick off the work out-of-band and return nothing, leaving the task in the
  // "working" state. In a serverless deployment you would enqueue this onto a
  // queue/worker (so it survives the function returning); on a long-lived Node
  // server we simply detach a promise. Either way, the result is written back
  // through the task store, which is what later tasks/get and tasks/result read.
  if (taskId) {
    void runJob(taskId, label, seconds);
    return;
  }

  // Fallback for a non-task invocation (only reachable if taskSupport changes).
  return `Job "${label}" ran inline.`;
}

async function runJob(taskId: string, label: string, seconds: number) {
  // The delay simulates real work; its duration comes from the caller.
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
  // Store a plain string: xmcp coerces it into a CallToolResult when the client
  // reads it back, just like returning a string from a normal tool.
  await store.storeTaskResult(
    taskId,
    "completed",
    `Job "${label}" finished after ${seconds}s.`
  );
}
