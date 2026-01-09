import { type ToolMetadata } from "xmcp";
import { getSession, getUser } from "@xmcp-dev/workos";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the full WorkOS user session and account information",
};

export default async function whoami() {
  const session = getSession();
  const user = await getUser();

  const userInfo = {
    session: {
      userId: session.userId,
      sessionId: session.sessionId,
      organizationId: session.organizationId || "N/A",
      role: session.role || "N/A",
      permissions: session.permissions || [],
      expiresAt: session.expiresAt.toISOString(),
      issuedAt: session.issuedAt.toISOString(),
    },
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName || "N/A",
      lastName: user.lastName || "N/A",
      emailVerified: user.emailVerified,
      profilePictureUrl: user.profilePictureUrl || "N/A",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };

  return JSON.stringify(userInfo, null, 2);
}
