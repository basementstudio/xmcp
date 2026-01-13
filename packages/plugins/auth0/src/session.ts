import { getAuthContext, getManagementClientContext } from "./context.js";
import type { AuthInfo, Auth0User } from "./types.js";

/**
 * Gets the current authentication information from the request context.
 *
 * Use this in your tools to access the authenticated user's information.
 *
 * @throws Error if called outside of an authenticated request context
 *
 * @example
 * ```typescript
 * import { getAuthInfo } from "@xmcp-dev/auth0";
 *
 * export default async function myTool() {
 *   const authInfo = getAuthInfo();
 *   return `Hello ${authInfo.extra.name}! Your user ID is ${authInfo.extra.sub}`;
 * }
 * ```
 */
export function getAuthInfo(): AuthInfo {
  const context = getAuthContext();

  if (!context.authInfo) {
    throw new Error(
      "[Auth0] Auth info not initialized. " +
        "Ensure this is called within a protected route that passed authentication."
    );
  }

  return context.authInfo;
}

/**
 * Get the full user profile from Auth0 Management API.
 *
 * Requires management config to be provided to the auth0Provider.
 *
 * @throws Error if management client is not configured or called outside auth context
 *
 * @example
 * ```typescript
 * import { getUser } from "@xmcp-dev/auth0";
 *
 * export default async function myTool() {
 *   const user = await getUser();
 *   return `Hello ${user.name}! Your metadata: ${JSON.stringify(user.user_metadata)}`;
 * }
 * ```
 */
export async function getUser(): Promise<Auth0User> {
  const authInfo = getAuthInfo();
  const { managementClient } = getManagementClientContext();

  if (!managementClient) {
    throw new Error(
      "[Auth0] Management client not configured. " +
        "Add management config to use getUser()."
    );
  }

  const { data } = await managementClient.users.get(authInfo.extra.sub);
  return data as Auth0User;
}
