import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";
import { getClient, getCustomerId } from "@xmcp-dev/commet";

export const schema = {
  format: z.enum(["csv", "json", "pdf"]).describe("Export format"),
};

export const metadata: ToolMetadata = {
  name: "export",
  description: "Export data in multiple formats, Pro plan only",
};

export default async function exportData({
  format,
}: InferSchema<typeof schema>) {
  const client = getClient();
  const customerId = getCustomerId();
  const { data } = await client.customer(customerId).features.check("export");

  if (!data?.allowed) {
    return "Your plan does not include this feature.";
  }

  return `Exported data as ${format}`;
}
