import { z } from "zod";
import type { ToolExtraArguments } from "xmcp";

export const metadata = {
  name: "whoami",
  description:
    "Returns information about the authenticated user from the OAuth token. Requires authentication.",
};

export const schema = {};

interface WhoamiResult {
  authenticated: boolean;
  clientId?: string;
  scopes?: string[];
  expiresAt?: string;
  userId?: string;
  email?: string;
  name?: string;
  organizationId?: string;
}

export default function whoami(
  _args: Record<string, never>,
  extra: ToolExtraArguments
): string {
  const { authInfo } = extra;

  if (!authInfo) {
    return JSON.stringify({
      authenticated: false,
    });
  }

  // Extract WorkOS-specific claims from extra
  const extraClaims = authInfo.extra || {};

  return JSON.stringify({
    authenticated: true,
    clientId: authInfo.clientId,
    scopes: authInfo.scopes,
    expiresAt: authInfo.expiresAt
      ? new Date(authInfo.expiresAt * 1000).toISOString()
      : undefined,
    // WorkOS-specific claims
    userId: extraClaims.sub as string | undefined,
    email: extraClaims.email as string | undefined,
    name: extraClaims.name as string | undefined,
    organizationId: extraClaims.org_id as string | undefined,
  });
}
