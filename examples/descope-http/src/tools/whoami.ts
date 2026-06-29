import type { ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/descope";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the authenticated Descope session information",
};

export default function whoami(): string {
  const session = getSession();

  return JSON.stringify(
    {
      userId: session.userId,
      loginIds: session.loginIds,
      permissions: session.permissions,
      roles: session.roles,
      tenants: session.tenants,
      expiresAt: session.expiresAt.toISOString(),
    },
    null,
    2,
  );
}
