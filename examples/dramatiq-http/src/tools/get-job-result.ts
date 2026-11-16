import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { bridge } from "../bridge";

export const schema = { jobId: z.string().uuid() };

export const metadata: ToolMetadata = {
  name: "get-job-result",
  description:
    "Read a word count job result. 'unavailable' means no result is stored; it does not mean the job is queued or running.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};

export default async function getJobResult(input: InferSchema<typeof schema>) {
  const result = await bridge().getResult(input.jobId, {
    signal: getRequestContext().signal,
  });
  return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
}
