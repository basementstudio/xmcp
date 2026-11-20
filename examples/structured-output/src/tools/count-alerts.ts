import { z } from "zod";
import type { ToolMetadata } from "xmcp";

export const outputSchema = z.number().int().min(0);

export const metadata: ToolMetadata = {
  name: "count-alerts",
  description: "Count the active weather alerts",
  annotations: { readOnlyHint: true },
};

export default function countAlerts() {
  return 2;
}
