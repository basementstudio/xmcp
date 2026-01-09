import { type ToolMetadata } from "xmcp";
import { getSession, getClient } from "@xmcp-dev/workos";

export const metadata: ToolMetadata = {
  name: "get-my-memberships",
  description: "Returns the user's organization memberships using the WorkOS SDK directly"
};

export default async function getMyMemberships(): Promise<string> {
  const session = getSession();
  const client = getClient();

  // Use the WorkOS SDK to fetch organization memberships
  const memberships = await client.userManagement.listOrganizationMemberships({
    userId: session.userId,
  });

  if (memberships.data.length === 0) {
    return "You are not a member of any organizations.";
  }

  return JSON.stringify(memberships.data, null, 2);
}

