import { isAbsolute } from "node:path";

import type { ClientDefinition } from "xmcp/client";
import { withClient } from "xmcp/client";

export function paperDefinition(): ClientDefinition {
  const command = process.env.PAPER_COMMAND;
  if (!command || !isAbsolute(command)) {
    throw new Error(
      "Set PAPER_COMMAND to the absolute CLI path from Paper Desktop's MCP panel."
    );
  }
  return { type: "stdio", name: "paper", command, args: ["mcp"] };
}

export function allowedTools(): Set<string> {
  return new Set(
    (process.env.PAPER_ALLOWED_TOOLS ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
  );
}

// Each operation owns and closes its CLI connection, including on errors.
export const withPaper = <T>(operation: Parameters<typeof withClient<T>>[1]) =>
  withClient(paperDefinition(), operation);
