import type { InferSchema, ToolMetadata } from "xmcp";
import { browserbaseRequest, sessionInput } from "../browserbase";

export const schema = sessionInput;
export const metadata: ToolMetadata = {
  name: "get-browser-session",
  description:
    "Read Browserbase session status and metadata. Does not return connection credentials.",
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
};
export default function getSession({ sessionId }: InferSchema<typeof schema>) {
  return browserbaseRequest(`/${sessionId}`);
}
