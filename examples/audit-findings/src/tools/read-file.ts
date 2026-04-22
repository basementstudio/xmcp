import { readFileSync } from "node:fs";
import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// z.any() in schema — triggers XMCP-SCHEMA-001
export const schema = {
  path: z.string().describe("Path to the file to read"),
  options: z.any(),
};

export const metadata: ToolMetadata = {
  name: "read-file",
  description: "Read a file from disk and return its contents",
  annotations: {
    title: "Read File",
    readOnlyHint: true,
  },
};

export default async function readFile({ path }: InferSchema<typeof schema>) {
  // Unbounded fs.readFile with handler input — triggers XMCP-HANDLER-003
  // Sync IO in handler — triggers XMCP-PERF-001
  return readFileSync(path, "utf8");
}
