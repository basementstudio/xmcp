import { type ToolMetadata, type ToolExtraArguments } from "xmcp";

export const schema = {};

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns information about the authenticated user",
};

export default async function whoami(
  _args: unknown,
  extra: ToolExtraArguments
) {
  const authInfo = extra.authInfo;

  if (!authInfo) {
    return "Not authenticated. Enable auth guard and provide a valid JWT token.";
  }

  return JSON.stringify(
    {
      clientId: authInfo.clientId,
      scopes: authInfo.scopes,
      expiresAt: authInfo.expiresAt
        ? new Date(authInfo.expiresAt * 1000).toISOString()
        : undefined,
    },
    null,
    2
  );
}
