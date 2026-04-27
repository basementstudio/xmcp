import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  userId: z.string().max(64).describe("User id to look up"),
};

export const outputSchema = z.object({
  id: z.string(),
  plan: z.string(),
});

export const metadata: ToolMetadata = {
  name: "fetch_plan",
  description: "Return the subscription plan for a user.",
};

export default async function fetchPlan({
  userId,
}: InferSchema<typeof schema>) {
  return { id: userId, plan: "pro" };
}
