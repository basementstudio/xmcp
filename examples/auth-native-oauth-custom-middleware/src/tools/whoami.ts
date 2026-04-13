import type { ToolMetadata } from "xmcp";
import { auth } from "xmcp/auth";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns the auth context attached by custom middleware",
};

export default function whoami(): string {
  const authInfo = auth();

  if (!authInfo) {
    return JSON.stringify({ authenticated: false }, null, 2);
  }

  const extra =
    authInfo.extra && typeof authInfo.extra === "object" ? authInfo.extra : {};

  return JSON.stringify(
    {
      authenticated: true,
      clientId: authInfo.clientId,
      userId:
        typeof extra.userId === "string"
          ? extra.userId
          : typeof extra.sub === "string"
            ? extra.sub
            : null,
      name: typeof extra.name === "string" ? extra.name : null,
      email: typeof extra.email === "string" ? extra.email : null,
      organization:
        typeof extra.organization === "string" ? extra.organization : null,
      scopes: authInfo.scopes,
      expiresAt: authInfo.expiresAt ?? null,
      extra,
    },
    null,
    2
  );
}
