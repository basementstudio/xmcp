import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  plan: z.enum(["starter", "team", "business"]).describe("The plan to look up"),
};

export const metadata: ToolMetadata = {
  name: "get-plan",
  description: "Describe what a plan includes",
  annotations: { readOnlyHint: true },
};

const SEATS = { starter: 1, team: 10, business: 50 };

export default function getPlan({ plan }: InferSchema<typeof schema>) {
  return { structuredContent: { plan, seats: SEATS[plan] } };
}
