import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";

export const schema = {
  invoiceId: z.string().describe("The invoice to refund, e.g. inv_1042"),
};

export const metadata: ToolMetadata = {
  name: "refund-invoice",
  description: "Refund an invoice in full",
  tags: ["admin"],
  annotations: { destructiveHint: true },
};

export default function refundInvoice({
  invoiceId,
}: InferSchema<typeof schema>) {
  return `Refunded ${invoiceId}.`;
}
