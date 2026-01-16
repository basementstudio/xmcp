import { getSessionContext } from "./context.js";
import type { AuthInfo } from "./types.js";

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
