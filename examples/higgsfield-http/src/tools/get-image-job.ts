import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { startCall } from "../jobs";
import { asToolError, settle } from "../results";

export const schema = {
  jobId: z
    .string()
    .regex(/^[\w-]{1,128}$/)
    .describe("jobId from generate-image or edit-image"),
};

export const metadata: ToolMetadata = {
  name: "get-image-job",
  description:
    "Wait for a Higgsfield job and return its image, or its current status if it is still running.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function getImageJob(input: InferSchema<typeof schema>) {
  const call = startCall(getRequestContext());
  try {
    return await settle(input.jobId, call);
  } catch (error) {
    return asToolError(error, call);
  }
}
