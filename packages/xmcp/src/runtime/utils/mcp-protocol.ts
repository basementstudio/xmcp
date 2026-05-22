import type { HttpHeaders } from "@/runtime/contexts/http-request-context";
import { getHeaderValue } from "@/runtime/utils/headers";

export const MCP_PROTOCOL_VERSION = "2026-07-28";

export interface McpRoutingHeaders {
  /** Value of the MCP-Protocol-Version header, when sent */
  protocolVersion?: string;
  /** Value of the Mcp-Method header (e.g. "tools/call"), when sent */
  mcpMethod?: string;
  /** Value of the Mcp-Name header (e.g. a tool name), when sent */
  mcpName?: string;
}

/**
 * Reads the 2026-07-28 routing headers (MCP-Protocol-Version, Mcp-Method,
 * Mcp-Name) from a request. All fields are optional so older clients that omit
 * them keep working during the deprecation window.
 */
export const readMcpRoutingHeaders = (
  headers: HttpHeaders
): McpRoutingHeaders => ({
  protocolVersion: getHeaderValue(headers, "mcp-protocol-version"),
  mcpMethod: getHeaderValue(headers, "mcp-method"),
  mcpName: getHeaderValue(headers, "mcp-name"),
});

/**
 * Pass-through routing validation: when an Mcp-Name header is present, it must
 * agree with the tool name carried in the JSON-RPC body. Returns an error
 * message on a clear mismatch, otherwise undefined. Requests without an
 * Mcp-Name header (older clients) or without a body tool name are not rejected.
 */
export const findMcpNameRoutingError = (
  mcpName: string | undefined,
  bodyToolNames: string[]
): string | undefined => {
  if (!mcpName || bodyToolNames.length === 0) {
    return undefined;
  }

  if (!bodyToolNames.includes(mcpName)) {
    return `Mcp-Name header "${mcpName}" does not match the requested tool: ${bodyToolNames.join(", ")}`;
  }

  return undefined;
};
