import type { ToolMetadata } from "xmcp";
import { getClerkSession, getClerkUser } from "@xmcp-dev/clerk";

export const metadata: ToolMetadata = {
  name: "get-user-info",
  description:
    "Returns information about the authenticated Clerk user",
  annotations: {
    title: "Get User Info",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getUserInfo(): Promise<string> {
  const session = getClerkSession();
  const user = await getClerkUser();

  const userInfo = {
    userId: session.userId,
    sessionId: session.sessionId,
    organizationId: session.organizationId,
    organizationRole: session.organizationRole,
    email: user.emailAddresses[0]?.emailAddress,
    firstName: user.firstName,
    lastName: user.lastName,
    imageUrl: user.imageUrl,
  };

  return JSON.stringify(userInfo, null, 2);
}

