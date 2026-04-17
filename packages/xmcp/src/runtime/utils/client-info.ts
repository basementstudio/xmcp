import type { JsonRpcMessage } from "@/runtime/transports/http/base-streamable-http";
import type { McpClientInfo } from "@/types/client-info";

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
