import { type ToolMetadata } from "xmcp";
import { getWorkOSSession, getWorkOSClient } from "@xmcp-dev/workos";

export const metadata: ToolMetadata = {
  name: "get-my-memberships",
  description:
    "Returns the user's organization memberships using the WorkOS SDK directly",
  annotations: {
    title: "Get My Memberships",
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
  },
};

export default async function getMyMemberships(): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const session = getWorkOSSession();
  const workos = getWorkOSClient();

  // Use the WorkOS SDK to fetch organization memberships
  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: session.userId,
  });

  if (memberships.data.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: "You are not a member of any organizations.",
        },
      ],
    };
  }

  const formattedMemberships = memberships.data.map((membership) => ({
    id: membership.id,
    organizationId: membership.organizationId,
    role: membership.role?.slug || "member",
    status: membership.status,
    createdAt: membership.createdAt,
  }));

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            userId: session.userId,
            membershipCount: memberships.data.length,
            memberships: formattedMemberships,
          },
          null,
          2
        ),
      },
    ],
  };
}

