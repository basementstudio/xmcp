import path from "node:path";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { type ResourceMetadata } from "xmcp";

const ROOT = "/var/log";

// Schema key `logId` drifts from the `[id]` path segment — triggers XMCP-RESOURCE-001
export const schema = {
  logId: z.string().describe("Log identifier"),
};

export const metadata: ResourceMetadata = {
  name: "log-by-id",
  title: "Log by ID",
  description: "Read a specific log file",
  mimeType: "text/plain",
};

export default function logById({ id }: { id: string }) {
  // Uses path.resolve but never decodes the URI component — triggers XMCP-MCP-011
  const resolved = path.resolve(ROOT, id);
  return readFileSync(resolved, "utf8");
}
