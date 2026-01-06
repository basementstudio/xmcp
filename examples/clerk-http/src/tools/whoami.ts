import type { ToolMetadata } from "xmcp";
import { getClerkSession } from "@xmcp-dev/clerk";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns basic identity information from the authenticated session",
  annotations: {
    title: "Who Am I",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function whoami(): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const session = getClerkSession();

  const identity = {
    userId: session.userId,
    sessionId: session.sessionId,
    organizationId: session.organizationId ?? null,
    organizationRole: session.organizationRole ?? null,
    tokenIssuedAt: session.issuedAt.toISOString(),
    tokenExpiresAt: session.expiresAt.toISOString(),
  };

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(identity, null, 2),
      },
    ],
  };
}

