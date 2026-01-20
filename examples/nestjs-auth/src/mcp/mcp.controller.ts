import { Controller, Post, Get, Options, Req, Res, Logger } from "@nestjs/common";
import { Request, Response } from "express";
import {
  XmcpService,
  McpAuth,
  Auth,
  AuthInfo,
  VerifyToken,
} from "@xmcp/adapter";

/**
 * Example token verification function.
 * In production, you would validate against your OAuth provider (Auth0, Clerk, etc.)
 *
 * This demo accepts any Bearer token and extracts user info from it.
 * For a real implementation, you would:
 * 1. Verify the JWT signature
 * 2. Check token expiration
 * 3. Validate scopes
 * 4. Look up user info from your auth provider
 */
const verifyToken: VerifyToken = async (
  req: Request,
  bearerToken?: string
): Promise<AuthInfo | undefined> => {
  const logger = new Logger("TokenVerification");

  if (!bearerToken) {
    logger.warn("No bearer token provided");
    return undefined;
  }

  // Demo: Parse the token as a simple base64-encoded JSON
  // In production, use proper JWT verification!
  try {
    // For this demo, we accept tokens in the format: base64({ clientId, scopes, expiresAt? })
    // Example token creation: btoa(JSON.stringify({ clientId: "user-123", scopes: ["mcp:read", "profile"] }))
    const decoded = JSON.parse(Buffer.from(bearerToken, "base64").toString());

    logger.log(`Token verified for client: ${decoded.clientId}`);

    return {
      token: bearerToken,
      clientId: decoded.clientId || "anonymous",
      scopes: decoded.scopes || [],
      expiresAt: decoded.expiresAt,
      extra: decoded.extra,
    };
  } catch (error) {
    // For demo purposes, also accept any token and treat it as the client ID
    logger.log(`Using token as client ID: ${bearerToken.substring(0, 20)}...`);

    return {
      token: bearerToken,
      clientId: bearerToken,
      scopes: ["mcp:read", "profile"],
    };
  }
};

@Controller("mcp")
export class McpController {
  private readonly logger = new Logger(McpController.name);

  constructor(private readonly xmcpService: XmcpService) {}

  /**
   * Main MCP endpoint with OAuth 2.0 Bearer token authentication.
   *
   * The @McpAuth decorator:
   * - Extracts the Bearer token from the Authorization header
   * - Calls verifyToken to validate and get auth info
   * - Attaches auth info to the request for access via @Auth() decorator
   * - Returns RFC 9728-compliant error responses if auth fails
   */
  @Post()
  @McpAuth({
    verifyToken,
    required: true, // Require authentication for all requests
    requiredScopes: ["mcp:read"], // Require the mcp:read scope
  })
  async handleMcp(
    @Auth() auth: AuthInfo,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    this.logger.log(`Authenticated request from client: ${auth?.clientId}`);
    this.logger.debug(`Scopes: ${auth?.scopes?.join(", ")}`);

    return this.xmcpService.handleRequest(req, res);
  }

  @Get()
  handleGet(@Res() res: Response): void {
    res.status(200).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed. MCP requires POST requests.",
      },
      id: null,
    });
  }

  @Options()
  handleOptions(@Res() res: Response): void {
    res.status(204).send();
  }
}
