import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { bridge } from "../bridge";

export const schema = {
  sessionId: z.uuid().describe("Current sessionId from figma-status"),
  kind: z.enum(["frame", "rectangle", "text"]),
  name: z.string().min(1).max(200),
  parentId: z
    .string()
    .min(1)
    .optional()
    .describe("Frame ID on the connected page; omit to create on the page"),
  x: z.number().min(-100000).max(100000).default(0),
  y: z.number().min(-100000).max(100000).default(0),
  width: z.number().positive().max(10000).default(320),
  height: z.number().positive().max(10000).default(180),
  fill: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#FFFFFF"),
  text: z.string().max(10000).default("Hello from xmcp"),
};
export const metadata: ToolMetadata = {
  name: "create-figma-node",
  description:
    "Create a frame, rectangle, or text node on the connected Figma page. Returns the created node ID. Repeated calls create additional nodes.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },
};
export default function createFigmaNode({
  sessionId,
  ...args
}: InferSchema<typeof schema>) {
  return bridge.execute(sessionId, "create", args);
}
