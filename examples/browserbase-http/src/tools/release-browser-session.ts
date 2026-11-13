import type { InferSchema, ToolMetadata } from "xmcp";
import { browserbaseRequest, sessionInput } from "../browserbase";

export const schema = sessionInput;
export const metadata: ToolMetadata = {
  name: "release-browser-session",
  description:
    "Request that Browserbase close a browser session and stop usage. This can interrupt active automation. The returned status may still be RUNNING; use get-browser-session to confirm completion.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: true,
  },
};
export default function releaseSession({
  sessionId,
}: InferSchema<typeof schema>) {
  return browserbaseRequest(`/${sessionId}`, { status: "REQUEST_RELEASE" });
}
