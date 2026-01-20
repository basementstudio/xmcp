import { SetMetadata } from "@nestjs/common";
import type { Request } from "express";

export const AUTH_CONFIG_KEY = "xmcp_auth_config";

export type AuthInfo = {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  resource?: URL;
  extra?: Record<string, unknown>;
};

export type VerifyToken = (
  req: Request,
  bearerToken?: string
) => Promise<AuthInfo | undefined>;

export type AuthConfig = {
  verifyToken: VerifyToken;
  required?: boolean;
  requiredScopes?: string[];
};

/**
 * Decorator to configure OAuth 2.0 Bearer token authentication for a route.
 * Use with XmcpAuthGuard to enable authentication.
 *
 * @example
 * ```typescript
 * @Post()
 * @UseGuards(XmcpAuthGuard)
 * @XmcpAuth({
 *   verifyToken: async (req, token) => {
 *     // Verify token and return auth info
 *     return { token, clientId: 'client-id', scopes: ['read'] };
 *   },
 *   required: true,
 *   requiredScopes: ['mcp:read'],
 * })
 * handleRequest(@Req() req, @Res() res) {
 *   // req.auth contains the verified auth info
 * }
 * ```
 */
export const XmcpAuth = (config: AuthConfig) =>
  SetMetadata(AUTH_CONFIG_KEY, config);
