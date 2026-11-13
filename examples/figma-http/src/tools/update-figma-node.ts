import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { bridge } from "../bridge";

export const schema = {
  sessionId: z.uuid().describe("Current sessionId from figma-status"),
  nodeId: z.string().min(1),
  patch: z
    .object({
      name: z.string().min(1).max(200).optional(),
      x: z.number().min(-100000).max(100000).optional(),
      y: z.number().min(-100000).max(100000).optional(),
      width: z.number().positive().max(10000).optional(),
      height: z.number().positive().max(10000).optional(),
      fill: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      text: z.string().max(10000).optional(),
    })
    .strict()
    .refine(
      (patch) => Object.keys(patch).length > 0,
      "Provide at least one property to update"
    ),
};
export const metadata: ToolMetadata = {
  name: "update-figma-node",
  description:
    "Update a frame, rectangle, or text node on the connected page. Text edits preserve fonts and replace the entire text value.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: true,
    openWorldHint: false,
  },
};
export default function updateFigmaNode({
  sessionId,
  ...args
}: InferSchema<typeof schema>) {
  return bridge.execute(sessionId, "update", args);
}
