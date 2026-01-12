import type { ToolMetadata } from "xmcp";
import { getAuthInfo } from "@xmcp-dev/auth0";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the full Auth0 user session and account information",
};

export default function whoami(): string {
  const authInfo = getAuthInfo();

  const userInfo = {
    user: {
      id: authInfo.extra.sub,
      email: authInfo.extra.email ?? "N/A",
      name: authInfo.extra.name ?? "N/A",
      clientId: authInfo.clientId,
    },
    token: {
      scopes: authInfo.scopes,
      expiresAt: authInfo.expiresAt
        ? new Date(authInfo.expiresAt * 1000).toISOString()
        : "N/A",
    },
  };

  return JSON.stringify(userInfo, null, 2);
}
