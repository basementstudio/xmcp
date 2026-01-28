import { z } from "zod";
import type { ToolExtraArguments } from "xmcp";

export const metadata = {
  name: "get_user_data",
  description:
    "Retrieves user data. This is a protected action that demonstrates scope-based access control.",
  annotations: {
    readOnlyHint: true,
  },
};

export const schema = {
  userId: z.string().describe("The user ID to fetch data for"),
};

interface UserData {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  role: string;
}

export default async function getUserData(
  { userId }: { userId: string },
  extra: ToolExtraArguments
): Promise<{ success: boolean; data?: UserData; error?: string }> {
  const { authInfo } = extra;

  // Check if user is authenticated
  if (!authInfo) {
    return {
      success: false,
      error: "Authentication required. Please provide a valid OAuth token.",
    };
  }

  // Check for required scope (example: users:read)
  const hasReadScope =
    authInfo.scopes.includes("users:read") ||
    authInfo.scopes.includes("admin") ||
    authInfo.scopes.includes("mcp:access");

  if (!hasReadScope) {
    return {
      success: false,
      error: `Insufficient permissions. Required scope: users:read. Your scopes: ${authInfo.scopes.join(", ")}`,
    };
  }

  // Simulate fetching user data
  // In a real app, you'd query a database or external API here
  const userData: UserData = {
    id: userId,
    email: `user-${userId}@example.com`,
    name: `User ${userId}`,
    createdAt: new Date().toISOString(),
    role: "member",
  };

  return {
    success: true,
    data: userData,
  };
}
