import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuthContext } from "./context.js";
import { OAuthAccessToken } from "better-auth/plugins";

export { betterAuthProvider, type BetterAuthConfig } from "./provider.js";

export function getBetterAuthSession(): OAuthAccessToken | null {
  const context = getBetterAuthContext();

  return context.api.api.getMcpSession({
    headers: fromNodeHeaders(context.headers),
  });
}
