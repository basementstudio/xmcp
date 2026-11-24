import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { cancel } from "../topaz";
import { textResult } from "../jobs";
import { asToolError } from "../results";

export const schema = {
  jobId: z
    .string()
    .regex(/^[\w-]{1,128}$/)
    .describe("jobId from upscale-image"),
};

export const metadata: ToolMetadata = {
  name: "cancel-upscale-job",
  description:
    "Cancel a Topaz job that has not finished. A finished job is charged in full.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function cancelUpscaleJob(
  input: InferSchema<typeof schema>
) {
  const call = getRequestContext();
  try {
    await cancel(input.jobId, call);
    return textResult({ jobId: input.jobId, status: "Cancelled" });
  } catch (error) {
    return asToolError(error, call);
  }
}
