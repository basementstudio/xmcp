import { xmcpHandler, withAuth, VerifyToken } from "@xmcp/adapter";

/**
 * Verify the bearer token and return auth information
 * In a real implementation, this would validate against your auth service
 */
const verifyToken: VerifyToken = async (req: Request, bearerToken?: string) => {
  if (!bearerToken) return undefined;

  // TODO: Replace with actual token verification logic
  // This is just an example implementation
  const isValid = bearerToken.startsWith("__TEST_VALUE__");

  if (!isValid) return undefined;

  return {
    token: bearerToken,
    scopes: ["read:messages", "write:messages"],
    clientId: "example-client",
    extra: {
      userId: "user-123",
      // Add any additional user/client information here
      permissions: ["user"],
      timestamp: new Date().toISOString(),
    },
  };
};

const options = {
  verifyToken,
  required: true,
  requiredScopes: ["read:messages"],
};

const handler = withAuth(xmcpHandler, options);

export { handler as GET, handler as POST };
