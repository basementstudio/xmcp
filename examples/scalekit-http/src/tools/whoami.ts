import type { ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/scalekit";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the authenticated user's session information",
};

export default function whoami(): string {
  const session = getSession();

  const userInfo = {
    userId: session.userId,
    organizationId: session.organizationId,
    scopes: session.scopes,
    expiresAt: session.expiresAt.toISOString(),
  };

  return JSON.stringify(userInfo, null, 2);
}