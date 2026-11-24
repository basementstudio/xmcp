import { z } from "zod";
import { getRequestContext, type InferSchema, type ToolMetadata } from "xmcp";
import { startCall } from "../jobs";
import { asToolError, settle } from "../results";

export const schema = {
  pollingUrl: z
    .url({ protocol: /^https$/ })
    .describe("pollingUrl from generate-image or edit-image"),
};

export const metadata: ToolMetadata = {
  name: "get-image-job",
  description:
    "Wait for a FLUX task and return its image, or its status if it is still running. Results are only available for ten minutes.",
  annotations: {
    readOnlyHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};

export default async function getImageJob(input: InferSchema<typeof schema>) {
  const call = startCall(getRequestContext());
  try {
    return await settle(input.pollingUrl, call);
  } catch (error) {
    return asToolError(error, call);
  }
}
