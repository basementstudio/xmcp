import { z } from "zod";
import type { InferSchema, ToolMetadata } from "xmcp";
import { getAuth0Client, getAuthInfo } from "@xmcp-dev/auth0";

export const schema = {
  connection: z
    .string()
    .describe("The connection name (e.g., 'google-oauth2', 'github')"),
};

export const metadata: ToolMetadata = {
  name: "get_connection_token",
  description:
    "Get an access token for an external provider via Auth0 Token Vault",
};

export default async function getConnectionToken({
  connection,
}: InferSchema<typeof schema>) {
  const client = getAuth0Client();
  const authInfo = getAuthInfo();

  try {
    const result = await client.getAccessTokenForConnection({
      connection,
      accessToken: authInfo.token,
    });

    return JSON.stringify(
      {
        connection: result.connection,
        accessToken: result.accessToken.substring(0, 20) + "...",
        scope: result.scope,
        expiresAt: new Date(result.expiresAt * 1000).toISOString(),
      },
      null,
      2
    );
  } catch (error) {
    return error instanceof Error
      ? error.message
      : "Failed to get connection token";
  }
}
