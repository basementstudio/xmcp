import { xmcpHandler, withAuth } from "@xmcp/adapter";
import { verifyClerkToken } from "@clerk/mcp-tools/next";
import { auth } from "@clerk/nextjs/server";

async function verifyToken(_req: Request, token?: string) {
  const clerkAuth = await auth({ acceptsToken: "oauth_token" });

  return verifyClerkToken(clerkAuth, token);
}

const options = {
  verifyToken,
  required: true,
  resourceMetadataPath: "/.well-known/oauth-protected-resource/mcp",
};

const handler = withAuth(xmcpHandler, options);

export { handler as GET, handler as POST };
