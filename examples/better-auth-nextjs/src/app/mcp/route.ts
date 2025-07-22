import { xmcpHandler } from "@xmcp/adapter";
import { withMcpAuth } from "better-auth/plugins";
import { auth } from "@/lib/auth";

const handler = withMcpAuth(auth, (req) => {
  return xmcpHandler(req);
});

export { handler as GET, handler as POST };
