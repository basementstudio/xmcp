import { getAuthContext } from "./context.js";
import type { AuthInfo } from "./types.js";

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
