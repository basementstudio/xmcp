import { type ToolMetadata } from "xmcp";
import { getWorkOSSession, getWorkOSUser } from "@xmcp-dev/workos";

// No schema needed - this tool takes no parameters
export const schema = {};

// Define tool metadata
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

// Tool implementation
export default async function whoami() {
  // Get session data from JWT claims (fast, no API call)
  const session = getWorkOSSession();

  // Get full user data from WorkOS API (includes email, name, etc.)
  const user = await getWorkOSUser();

  const userInfo = {
    // From JWT session
    session: {
      userId: session.userId,
      sessionId: session.sessionId,
      organizationId: session.organizationId || "N/A",
      role: session.role || "N/A",
      permissions: session.permissions || [],
      expiresAt: session.expiresAt.toISOString(),
      issuedAt: session.issuedAt.toISOString(),
    },
    // From WorkOS API (full user details)
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
        text: `WorkOS User Information:\n${JSON.stringify(userInfo, null, 2)}`,
      },
    ],
  };
}
