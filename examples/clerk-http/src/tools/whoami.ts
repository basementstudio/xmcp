import type { ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/clerk";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns basic identity information from the authenticated session",
  annotations: {
    title: "Who Am I",
    readOnlyHint: true,
    idempotentHint: true,
  },
};

export default async function whoami(): Promise<string> {
  const session = getSession();

  const identity = {
    userId: session.userId,
    sessionId: session.sessionId,
    organizationId: session.organizationId ?? null,
    organizationRole: session.organizationRole ?? null,
    tokenIssuedAt: session.issuedAt.toISOString(),
    tokenExpiresAt: session.expiresAt.toISOString(),
  };

  return JSON.stringify(identity, null, 2)
}

