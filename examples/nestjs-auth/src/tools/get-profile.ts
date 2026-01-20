import { z } from "zod";
import { type InferSchema, type ToolMetadata, type ToolExtraArguments } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "get-profile",
  description: "Get the authenticated user's profile information",
  annotations: {
    title: "Get Profile",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

/**
 * This tool demonstrates how to access authentication info within a tool.
 *
 * The second argument (extra) contains:
 * - authInfo: The authenticated user's information (token, clientId, scopes, etc.)
 * - signal: AbortSignal for cancellation
 * - sessionId: The MCP session ID
 * - requestId: The JSON-RPC request ID
 * - requestInfo: HTTP request headers
 * - sendNotification: Function to send MCP notifications
 * - sendRequest: Function to send MCP requests
 *
 * Note: authInfo is only available when authentication is configured
 * in the controller using @McpAuth decorator.
 */
export default async function getProfile(
  _args: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const { authInfo } = extra;

  if (!authInfo) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "Not authenticated",
              message: "No authentication information available",
            },
            null,
            2
          ),
        },
      ],
    };
  }

  // Build the profile response from auth info
  const profile = {
    clientId: authInfo.clientId,
    scopes: authInfo.scopes,
    expiresAt: authInfo.expiresAt
      ? new Date(authInfo.expiresAt * 1000).toISOString()
      : undefined,
    resource: authInfo.resource?.toString(),
    extra: authInfo.extra,
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(profile, null, 2),
      },
    ],
  };
}
