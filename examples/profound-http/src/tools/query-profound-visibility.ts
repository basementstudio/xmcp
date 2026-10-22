import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { profoundRequest } from "../profound";
import { reportBody, reportSchema } from "../reports";

export const schema = {
  ...reportSchema,
  assets: z
    .array(z.string().min(1))
    .min(1)
    .max(50)
    .optional()
    .describe("Optional exact asset names to select"),
};
export const metadata: ToolMetadata = {
  name: "query-profound-visibility",
  description:
    "Retrieve one page of Profound v2 visibility metrics. Returns provider metrics and pagination information unchanged.",
  annotations: { readOnlyHint: true, openWorldHint: true },
};
export default function queryProfoundVisibility({
  assets,
  ...input
}: InferSchema<typeof schema>) {
  return profoundRequest("/v2/reports/visibility", {
    body: { ...reportBody(input), assets },
  });
}
