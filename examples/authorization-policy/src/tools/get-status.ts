import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "get-status",
  description: "Report whether the billing system is operational",
  annotations: { readOnlyHint: true },
};

export default function getStatus() {
  return "Billing is operational.";
}
