import { createMcpAuthGuard } from "@xmcp/adapter";
import * as jwt from "jsonwebtoken";

/**
 * Example JWT auth guard configuration.
 *
 * To enable authentication:
 * 1. Add McpAuthGuard to providers in xmcp.module.ts
 * 2. Add @UseGuards(McpAuthGuard) to xmcp.controller.ts
 */
export const McpAuthGuard = createMcpAuthGuard({
  verifyToken: async (token) => {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as jwt.JwtPayload;

    return {
      clientId: decoded.sub || "unknown",
      scopes: decoded.scope?.split(" ") || [],
      expiresAt: decoded.exp,
    };
  },
  required: false, // Set to true to require authentication
});
