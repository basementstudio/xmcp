import type { InferSchema, ToolMetadata } from "xmcp";
import { z } from "zod";

import { allowedTools, withPaper } from "../paper";

export const schema = {
  name: z
    .string()
    .min(1)
    .describe("An allowed upstream name from list-paper-tools"),
  arguments: z
    .record(z.string(), z.unknown())
    .describe("Arguments matching that Paper tool's input schema"),
};

export const metadata: ToolMetadata = {
  name: "call-paper-tool",
  description:
    "Call an explicitly allowed Paper tool. Can modify the currently open Paper file; inspect list-paper-tools first.",
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: true,
  },
};

export default async function callPaperTool(input: InferSchema<typeof schema>) {
  // Enforce the policy on direct calls, before opening a connection.
  if (!allowedTools().has(input.name)) {
    return {
      isError: true,
      content: [
        {
          type: "text" as const,
          text: "This tool is not enabled in PAPER_ALLOWED_TOOLS.",
        },
      ],
    };
  }
  return withPaper(async (client) => {
    const result = await client.callTool(input);
    // Forward the complete MCP result, including images, structuredContent, and isError.
    if (!("content" in result))
      throw new Error("Paper did not return a tool result.");
    return result;
  });
}
