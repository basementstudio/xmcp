import { fromNodeHeaders } from "better-auth/node";
import { getBetterAuthContext } from "./better-auth-context.js";
import { OAuthAccessToken } from "better-auth/plugins";

export { betterAuthProvider } from "./better-auth.js";

export function getBetterAuthSession(): OAuthAccessToken | null {
  const context = getBetterAuthContext();

  return context.api.api.getMcpSession({
    headers: fromNodeHeaders(context.headers),
  });
}
