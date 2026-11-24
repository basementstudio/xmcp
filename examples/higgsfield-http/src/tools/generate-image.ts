import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { GENERATE_PATH, submit } from "../higgsfield";
import { startCall } from "../jobs";
import { asToolError, resumable, settle } from "../results";

export const schema = { prompt: z.string().trim().min(1).max(4000) };

export const metadata: ToolMetadata = {
  name: "generate-image",
  description:
    "Generate an image with Higgsfield Soul. Returns the image, or a jobId if it takes longer than about 50 seconds. Uses the server's Higgsfield balance.",
  annotations: {
    readOnlyHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function generateImage(input: InferSchema<typeof schema>) {
  const call = startCall(getRequestContext());
  try {
    const jobId = await submit(GENERATE_PATH, { prompt: input.prompt }, call);
    return await settle(jobId, call).catch((error) =>
      resumable(error, call, jobId)
    );
  } catch (error) {
    return asToolError(error, call);
  }
}
