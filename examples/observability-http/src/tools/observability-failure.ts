import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  reason: z
    .string()
    .min(1, "Reason is required")
    .default("upstream dependency timeout")
    .describe("Reason to include in the thrown error"),
};

export const metadata: ToolMetadata = {
  name: "observability-failure",
  description: "Intentionally throws to demonstrate observability failure logs",
};

export default async function observabilityFailure({
  reason,
}: InferSchema<typeof schema>) {
  throw new Error(`Simulated tool failure: ${reason}`);
}
