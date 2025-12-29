import { type ToolMetadata } from "xmcp";
import { getWorkOSSession } from "@xmcp-dev/workos";

// No schema - this tool takes no parameters

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Get the current authenticated user's profile information",
  annotations: {
    title: "Who Am I",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function whoami() {
  const session = await getWorkOSSession();
  const { user, organizationId, impersonator } = session;

  const profile = {
    id: user.id,
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    emailVerified: user.emailVerified,
    profilePictureUrl: user.profilePictureUrl,
    createdAt: user.createdAt,
    ...(organizationId && { organizationId }),
    ...(impersonator && { impersonator }),
  };

  return {
    content: [{ type: "text", text: JSON.stringify(profile, null, 2) }],
  };
}

