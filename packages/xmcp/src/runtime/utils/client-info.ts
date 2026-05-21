import type { JsonRpcMessage } from "@/runtime/transports/http/base-streamable-http";
import type { HttpHeaders } from "@/runtime/contexts/http-request-context";
import type { McpClientInfo } from "@/types/client-info";
import type { Implementation } from "@modelcontextprotocol/sdk/types";

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const parseClientInfoCandidate = (
  candidate: unknown
): McpClientInfo | undefined => {
  if (!isObject(candidate)) {
    return undefined;
  }

  if (
    typeof candidate.name !== "string" ||
    typeof candidate.version !== "string"
  ) {
    return undefined;
  }

  const result: McpClientInfo = {
    name: candidate.name,
    version: candidate.version,
  };

  if (typeof candidate.title === "string") {
    result.title = candidate.title;
  }

  if (typeof candidate.websiteUrl === "string") {
    result.websiteUrl = candidate.websiteUrl;
  }

  if (typeof candidate.description === "string") {
    result.description = candidate.description;
  }

  return result;
};

export const mapImplementationToClientInfo = (
  implementation: Implementation | undefined
): McpClientInfo | undefined => {
  return parseClientInfoCandidate(implementation);
};

export const extractClientInfoFromMessage = (
  message: JsonRpcMessage | undefined
): McpClientInfo | undefined => {
  if (!message || message.method !== "initialize") {
    return undefined;
  }

  if (!isObject(message.params)) {
    return undefined;
  }

  return parseClientInfoCandidate(message.params.clientInfo);
};

export const extractClientInfoFromMessages = (
  payload: unknown
): McpClientInfo | undefined => {
  const messages = Array.isArray(payload)
    ? (payload as JsonRpcMessage[])
    : ([payload] as JsonRpcMessage[]);

  for (const message of messages) {
    const clientInfo = extractClientInfoFromMessage(message);
    if (clientInfo) {
      return clientInfo;
    }
  }

  return undefined;
};

const getHeaderValue = (
  headers: HttpHeaders,
  headerName: string
): string | undefined => {
  const normalizedHeaderName = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== normalizedHeaderName) {
      continue;
    }

    const headerValue = Array.isArray(value) ? value[0] : value;
    if (typeof headerValue !== "string") {
      return undefined;
    }

    const trimmedValue = headerValue.trim();
    return trimmedValue.length > 0 ? trimmedValue : undefined;
  }

  return undefined;
};

export const extractClientInfoFromHeaders = (
  headers: HttpHeaders
): McpClientInfo | undefined => {
  return parseClientInfoCandidate({
    name: getHeaderValue(headers, "x-mcp-client-name"),
    version: getHeaderValue(headers, "x-mcp-client-version"),
    title: getHeaderValue(headers, "x-mcp-client-title"),
    websiteUrl: getHeaderValue(headers, "x-mcp-client-website-url"),
    description: getHeaderValue(headers, "x-mcp-client-description"),
  });
};
