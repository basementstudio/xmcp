import type { ToolMetadata } from "xmcp";
import { getSession, getUser } from "@xmcp-dev/clerk";

export const metadata: ToolMetadata = {
  name: "get-user-info",
  description: "Get user details",
};

export default async function getUserInfo(): Promise<string> {
  const session = getSession();
  const user = await getUser();

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

