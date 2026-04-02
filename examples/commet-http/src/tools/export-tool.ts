import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { headers } from "xmcp/headers";
import { commet } from "../lib/commet";

export const schema = {
  format: z.enum(["csv", "json", "pdf"]).describe("Export format"),
};

export const metadata: ToolMetadata = {
  name: "export",
  description: "Export data in multiple formats — boolean feature, Pro plan only",
  annotations: {
    title: "Export data",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

// Boolean gate — check() only, no usage tracked
export default async function exportData({
  format,
}: InferSchema<typeof schema>) {
  const customerKey = headers()["customer-key"];

  const result = await commet.check(customerKey as string, "export");

  if (!result.allowed) {
    return result.message;
  }

  return `Exported data as ${format} (plan: ${result.plan})`;
}
