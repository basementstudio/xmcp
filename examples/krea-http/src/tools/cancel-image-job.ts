import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { cancelJob } from "../krea";
import { asToolError } from "../results";

export const schema = {
  jobId: z
    .string()
    .regex(/^[\w-]{1,128}$/)
    .describe("jobId from generate-image"),
};

// The plain object returned below becomes structuredContent.
export const outputSchema = { jobId: z.string(), status: z.string() };

export const metadata: ToolMetadata = {
  name: "cancel-image-job",
  description:
    "Cancel a Krea job that is still queued or processing. Cancelled jobs are not billed.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function cancelImageJob(
  input: InferSchema<typeof schema>
) {
  const call = getRequestContext();
  try {
    await cancelJob(input.jobId, call);
    return { jobId: input.jobId, status: "cancelled" };
  } catch (error) {
    return asToolError(error, call);
  }
}
