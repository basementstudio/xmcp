import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  reason: z
    .string()
    .min(1)
    .default("something went wrong")
    .describe("Reason for the simulated failure"),
};

export const metadata: ToolMetadata = {
  name: "fail",
  description: "Intentionally throws to generate error logs",
};

export default async function fail({ reason }: InferSchema<typeof schema>) {
  throw new Error(`Simulated failure: ${reason}`);
}
