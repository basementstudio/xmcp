import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// This tool requires the "admin" scope. It's only visible to authenticated
// users whose token includes the "admin" scope.

export const schema = {
  action: z
    .enum(["list-users", "reset-cache", "view-logs"])
    .describe("The admin action to perform"),
};

export const metadata: ToolMetadata = {
  name: "admin-panel",
  description: "Perform administrative actions. Requires admin scope.",
  requiresAuth: true,
  requiredScopes: ["admin"],
  annotations: {
    title: "Admin Panel",
    destructiveHint: true,
  },
};

export default async function adminPanel({
  action,
}: InferSchema<typeof schema>) {
  return `Admin action "${action}" executed successfully.`;
}
