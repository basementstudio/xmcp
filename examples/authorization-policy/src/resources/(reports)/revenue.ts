import type { ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "revenue",
  title: "Revenue report",
  description: "Monthly revenue totals",
  tags: ["admin"],
};

export default function revenue() {
  return JSON.stringify({ month: "2026-10", revenueInCents: 1842000 });
}
