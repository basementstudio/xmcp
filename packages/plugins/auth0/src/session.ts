import { getClientContext, getSessionContext } from "./context.js";
import type { AuthInfo, Auth0User } from "./types.js";

export function getAuthInfo(): AuthInfo {
  const context = getSessionContext();

  if (!context.authInfo) {
    throw new Error(
      "[Auth0] Auth info not initialized. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.authInfo;
}

export async function getUser(): Promise<Auth0User> {
  const authInfo = getAuthInfo();
  const { managementClient } = getClientContext();

  if (!managementClient) {
    throw new Error(
      "[Auth0] Management client not configured. " +
        "Add management config to use getUser()."
    );
  }

  try {
    const { data } = await managementClient.users.get(authInfo.user.sub);
    return data as Auth0User;
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("403") ||
        error.message.includes("Forbidden")
      ) {
        throw new Error(
          "You don't have permission to access user profile data."
        );
      }
      if (error.message.includes("401")) {
        throw new Error(
          "You don't have permission to access user profile data."
        );
      }
    }
    throw error;
  }
}
