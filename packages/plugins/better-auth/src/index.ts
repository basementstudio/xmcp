import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuthContext } from "./context.js";
import { OAuthAccessToken } from "better-auth/plugins";

export { betterAuthProvider, type BetterAuthConfig } from "./provider.js";

export function getBetterAuthSession(): OAuthAccessToken {
  const context = getBetterAuthContext();

  const session = context.api.api.getMcpSession({
    headers: fromNodeHeaders(context.headers),
  });

  if (!session) {
    throw new Error(
      "getBetterAuthSession must be used within a betterAuthProvider"
    );
  }

  return session;
}
