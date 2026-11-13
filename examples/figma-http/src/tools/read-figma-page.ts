import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { bridge } from "../bridge";

export const schema = {
  sessionId: z.uuid().describe("Current sessionId from figma-status"),
};
export const metadata: ToolMetadata = {
  name: "read-figma-page",
  description:
    "Read the current selection and up to 100 top-level nodes in the connected page.",
  annotations: { readOnlyHint: true, openWorldHint: false },
};
export default function readFigmaPage({
  sessionId,
}: InferSchema<typeof schema>) {
  return bridge.execute(sessionId, "read", {});
}
