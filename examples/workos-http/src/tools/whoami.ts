import { type ToolMetadata } from "xmcp";
import { getWorkOSSession, getWorkOSUser } from "@xmcp-dev/workos";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the full WorkOS user session and account information",
  annotations: {
    title: "Who Am I",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function whoami() {
  const session = getWorkOSSession();
  const user = await getWorkOSUser();

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

  return {
    content: [
      {
        type: "text",
        text: `${JSON.stringify(userInfo, null, 2)}`,
      },
    ],
  };
}
