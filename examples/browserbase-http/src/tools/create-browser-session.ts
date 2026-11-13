import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";
import {
  browserbaseRequest,
  DEFAULT_SESSION_TIMEOUT_SECONDS,
  MAX_SESSION_TIMEOUT_SECONDS,
} from "../browserbase";

export const schema = {
  timeoutSeconds: z
    .number()
    .int()
    .min(60)
    .max(MAX_SESSION_TIMEOUT_SECONDS)
    .default(DEFAULT_SESSION_TIMEOUT_SECONDS)
    .describe("Maximum session lifetime in seconds; browser usage is billable"),
  keepAlive: z
    .boolean()
    .default(false)
    .describe(
      "Keep the session running after disconnect; requires a paid Browserbase plan"
    ),
};
export const metadata: ToolMetadata = {
  name: "create-browser-session",
  description:
    "Create a billable Browserbase browser session when requested by the user. Returns metadata, not browser connection credentials. Check the dashboard before retrying any uncertain failure to avoid duplicate sessions.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
  },
};
export default function createSession({
  timeoutSeconds,
  keepAlive,
}: InferSchema<typeof schema>) {
  const projectId = process.env.BROWSERBASE_PROJECT_ID?.trim();
  return browserbaseRequest("", {
    timeout: timeoutSeconds,
    keepAlive,
    ...(projectId ? { projectId } : {}),
  });
}
