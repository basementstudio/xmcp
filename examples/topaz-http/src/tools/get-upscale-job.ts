import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { startCall } from "../jobs";
import { asToolError, settle } from "../results";

export const schema = {
  jobId: z
    .string()
    .regex(/^[\w-]{1,128}$/)
    .describe("jobId from upscale-image"),
};

export const metadata: ToolMetadata = {
  name: "get-upscale-job",
  description:
    "Wait for a Topaz job and return its image with a fresh one-hour download link, or its progress if it is still running.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function getUpscaleJob(input: InferSchema<typeof schema>) {
  const call = startCall(getRequestContext());
  try {
    return await settle(input.jobId, call);
  } catch (error) {
    return asToolError(error, call);
  }
}
