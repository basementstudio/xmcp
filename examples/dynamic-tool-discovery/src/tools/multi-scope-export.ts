import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// Multi-scope gating. The caller must hold BOTH "read:users" and
// "write:reports" scopes for this tool to appear in tool listings.

export const schema = {
  format: z
    .enum(["csv", "json", "pdf"])
    .describe("Export file format"),
};

export const metadata: ToolMetadata = {
  name: "multi-scope-export",
  description:
    "Export user data to a report file. Requires read:users AND write:reports scopes.",
  requiredScopes: ["read:users", "write:reports"],
  annotations: {
    title: "Multi-Scope Export",
  },
};

export default async function multiScopeExport({
  format,
}: InferSchema<typeof schema>) {
  return `User export prepared in ${format.toUpperCase()} format.`;
}
