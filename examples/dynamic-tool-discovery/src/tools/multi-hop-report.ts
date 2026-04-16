import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// Three-level dependency chain:
//   multi-hop-report → advanced-analytics → admin-panel
// The tool is only visible when the entire chain resolves, which in this
// example means the caller must have the "admin" scope.

export const schema = {
  periodDays: z
    .number()
    .int()
    .positive()
    .max(365)
    .describe("Reporting window, in days (1–365)"),
};

export const metadata: ToolMetadata = {
  name: "multi-hop-report",
  description:
    "Aggregated report that requires advanced-analytics (which in turn requires admin-panel).",
  dependsOn: ["advanced-analytics"],
  annotations: {
    title: "Multi-Hop Report",
    readOnlyHint: true,
  },
};

export default async function multiHopReport({
  periodDays,
}: InferSchema<typeof schema>) {
  return `Report for the last ${periodDays} day(s) generated via the admin → analytics → report chain.`;
}
