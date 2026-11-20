import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "list-invoices",
  description: "List the most recent invoices",
  tags: ["support"],
  annotations: { readOnlyHint: true },
};

const INVOICES = [
  { id: "inv_1042", customer: "Acme", amountInCents: 12900, status: "paid" },
  { id: "inv_1043", customer: "Globex", amountInCents: 4900, status: "open" },
];

export default function listInvoices() {
  return { structuredContent: { invoices: INVOICES } };
}
