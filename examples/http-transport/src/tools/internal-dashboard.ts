import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "internal-dashboard",
  description:
    "An internal dashboard excluded by the component visibility rules",
  tags: ["internal"],
  _meta: { ui: {} },
};

export default function internalDashboard() {
  return "<main><h1>Internal dashboard</h1></main>";
}
