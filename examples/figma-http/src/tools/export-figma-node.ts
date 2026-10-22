import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { bridge } from "../bridge";

export const schema = {
  sessionId: z.uuid().describe("Current sessionId from figma-status"),
  nodeId: z.string().min(1),
  format: z.enum(["PNG", "SVG"]).default("PNG"),
};
export const metadata: ToolMetadata = {
  name: "export-figma-node",
  description:
    "Export a node on the connected page as a PNG image or SVG text.",
  annotations: { readOnlyHint: true, openWorldHint: false },
};
export default function exportFigmaNode({
  sessionId,
  ...args
}: InferSchema<typeof schema>) {
  return bridge.execute(sessionId, "export", args);
}
