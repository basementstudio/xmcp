import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { cancelRequest } from "../higgsfield";
import { asToolError } from "../results";

export const schema = {
  jobId: z
    .string()
    .regex(/^[\w-]{1,128}$/)
    .describe("jobId from generate-image or edit-image"),
};

// The plain object returned below becomes structuredContent.
export const outputSchema = { jobId: z.string(), status: z.string() };

export const metadata: ToolMetadata = {
  name: "cancel-image-job",
  description:
    "Cancel a Higgsfield job that is still queued. Jobs that already started cannot be cancelled.",
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
    await cancelRequest(input.jobId, call);
    return { jobId: input.jobId, status: "canceled" };
  } catch (error) {
    return asToolError(error, call);
  }
}
