import { xmcpHandler } from "@xmcp/adapter";
import { requireMcpAuth } from "@better-auth/mcp";
import { auth, mcpResource } from "@/lib/auth";

const handler = requireMcpAuth(auth, (request) => xmcpHandler(request), {
  resource: mcpResource,
});

export { handler as GET, handler as POST };
