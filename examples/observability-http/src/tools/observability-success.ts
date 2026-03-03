import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

export const schema = {
  action: z.string().min(1).describe("Action name for the simulated workflow"),
  userId: z.string().min(1).describe("Application user identifier"),
};

export const metadata: ToolMetadata = {
  name: "observability-success",
  description: "Returns a successful payload for observability log demonstrations",
};

export default async function observabilitySuccess({
  action,
  userId,
}: InferSchema<typeof schema>) {
  const response = {
    status: "ok",
    action,
    userId,
    requestProcessedAt: new Date().toISOString(),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(response) }],
    structuredContent: response,
  };
}
