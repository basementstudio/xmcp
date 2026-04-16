import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// This tool depends on "admin-panel". It's only visible when admin-panel
// is also registered (i.e., the user has the "admin" scope).
// This creates progressive discovery: admin tools unlock analytics tools.

export const schema = {
  report: z
    .enum(["usage", "performance", "errors"])
    .describe("The type of analytics report to generate"),
};

export const metadata: ToolMetadata = {
  name: "advanced-analytics",
  description:
    "Generate analytics reports. Only available when admin-panel is accessible.",
  dependsOn: ["admin-panel"],
  annotations: {
    title: "Advanced Analytics",
    readOnlyHint: true,
  },
};

export default async function advancedAnalytics({
  report,
}: InferSchema<typeof schema>) {
  return `Analytics report "${report}" generated.`;
}
