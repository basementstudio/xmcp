import type { Request } from "express";
import type { JsonRpcMessage } from "@/runtime/transports/http/base-streamable-http";

export function extractToolNamesFromRequest(request: Request): string[] {
  if (request?.body === undefined || request.body === null) {
    return [];
  }

  const messages: JsonRpcMessage[] = Array.isArray(request.body)
    ? request.body
    : [request.body];

  const toolNames: string[] = [];

  for (const message of messages) {
    if (
      typeof message === "object" &&
      message !== null &&
      "method" in message &&
      message.method === "tools/call"
    ) {
      const params = message.params;

      if (
        params &&
        typeof params === "object" &&
        "name" in params &&
        typeof (params as { name?: unknown }).name === "string"
      ) {
        toolNames.push((params as { name: string }).name);
      }
    }
  }

  return toolNames;
}

export function storeToolNamesOnRequestHeaders(
  request: Request,
  toolNames: string[]
): void {
  if (toolNames.length === 0) {
    return;
  }

  request.headers["x-mcp-tool-name"] = toolNames[0];
  request.headers["x-mcp-tool-names"] = toolNames.join(",");
}
