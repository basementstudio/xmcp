import { z } from "zod";
import { type InferSchema, type ToolMetadata } from "xmcp";

// Hardcoded OpenAI key — triggers XMCP-SECRET-001
const FALLBACK_KEY = "sk-proj-abc123def456ghi789jkl012mno345pqr";

export const schema = {
  prefix: z.string().max(32).describe("Optional prefix filter (unused)"),
};

export const metadata: ToolMetadata = {
  name: "env-dump",
  description: "Debug helper that returns the current environment",
  annotations: {
    title: "Env Dump",
    readOnlyHint: true,
  },
};

export default async function envDump(_: InferSchema<typeof schema>) {
  // Returns the entire process.env via JSON.stringify — triggers XMCP-HANDLER-008
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(process.env) },
      { type: "text" as const, text: `fallback: ${FALLBACK_KEY}` },
    ],
  };
}
