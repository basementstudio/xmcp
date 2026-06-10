import { z } from "zod";
import {
  type InferSchema,
  type ToolExtraArguments,
  type ToolMetadata,
} from "xmcp";
import { enqueue } from "../queue";

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

  // The tool does NOT run the job. It only hands the work off to the queue and
  // returns nothing, leaving the task in the "working" state. A separate
  // process (src/worker.ts) picks the job up, runs it, and writes the result
  // back through the shared task store — which is what later tasks/get and
  // tasks/result read. This is the serverless model: enqueue here, execute
  // elsewhere.
  if (taskId) {
    await enqueue({ taskId, label, seconds });
    return;
  }

  // Fallback for a non-task invocation (only reachable if taskSupport changes).
  return `Job "${label}" ran inline.`;
}
