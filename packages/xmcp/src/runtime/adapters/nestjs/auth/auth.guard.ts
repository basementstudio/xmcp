import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from "@nestjs/common";
import { Request, Response } from "express";
import { AUTH_CONFIG_KEY, AuthConfig, AuthInfo } from "./auth.decorator";

/**
 * Standard OAuth Protected Resource Metadata path (RFC 9728)
 */
const RESOURCE_METADATA_PATH = "/.well-known/oauth-protected-resource";

/**
 * OAuth error codes (MCP-specific)
 */
const AUTH_ERROR_CODES = {
  INVALID_TOKEN: -32001,
  INSUFFICIENT_SCOPE: -32002,
} as const;

/**
 * NestJS Guard for OAuth 2.0 Bearer token authentication.
 * Use with @XmcpAuth decorator to configure authentication.
 *
 * @example
 * ```typescript
 * @Controller('mcp')
 * @UseGuards(XmcpAuthGuard)
 * export class McpController {
 *   @Post()
 *   @XmcpAuth({
 *     verifyToken: async (req, token) => ({ token, clientId: '...', scopes: [] }),
 *     required: true,
 *   })
 *   handleRequest(@Req() req, @Res() res) { ... }
 * }
 * ```
 */
@Injectable()
export class XmcpAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Use Reflect.getMetadata directly to avoid importing @nestjs/core
    const authConfig = Reflect.getMetadata(
      AUTH_CONFIG_KEY,
      context.getHandler()
    ) as AuthConfig | undefined;

    // No auth config = no auth required
    if (!authConfig) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const { verifyToken, required = false, requiredScopes } = authConfig;

    // Extract bearer token
    const bearerToken = this.extractBearerToken(request);

    // Verify token
    let authInfo: AuthInfo | undefined;
    try {
      authInfo = await verifyToken(request, bearerToken);
    } catch (error) {
      console.error("[MCP Auth] Error verifying token:", error);
      this.sendAuthError(
        response,
        request,
        "invalid_token",
        "Invalid token",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
      return false;
    }

    // Check if authentication is required but not provided
    if (required && !authInfo) {
      this.sendAuthError(
        response,
        request,
        "invalid_token",
        "No authorization provided",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
      return false;
    }

    // If no auth info, proceed without it
    if (!authInfo) {
      return true;
    }

    // Validate token expiration
    if (this.isTokenExpired(authInfo)) {
      this.sendAuthError(
        response,
        request,
        "invalid_token",
        "Token has expired",
        401,
        AUTH_ERROR_CODES.INVALID_TOKEN
      );
      return false;
    }

    // Validate required scopes
    if (requiredScopes?.length && !this.hasRequiredScopes(authInfo, requiredScopes)) {
      this.sendAuthError(
        response,
        request,
        "insufficient_scope",
        "Insufficient scope",
        403,
        AUTH_ERROR_CODES.INSUFFICIENT_SCOPE
      );
      return false;
    }

    // Attach auth info to request
    (request as Request & { auth?: AuthInfo }).auth = authInfo;

    return true;
  }

  /**
   * Extracts bearer token from Authorization header
   */
  private extractBearerToken(req: Request): string | undefined {
    const authHeader = req.headers.authorization;
    const [type, token] = authHeader?.split(" ") || [];
    return type?.toLowerCase() === "bearer" ? token : undefined;
  }

  /**
   * Validates that token has not expired
   */
  private isTokenExpired(authInfo: AuthInfo): boolean {
    return (
      authInfo.expiresAt !== undefined && authInfo.expiresAt < Date.now() / 1000
    );
  }

  /**
   * Validates that token has all required scopes
   */
  private hasRequiredScopes(
    authInfo: AuthInfo,
    requiredScopes: string[]
  ): boolean {
    return requiredScopes.every((scope) => authInfo.scopes.includes(scope));
  }

  /**
   * Sends an OAuth authentication error response
   */
  private sendAuthError(
    res: Response,
    req: Request,
    errorCode: string,
    errorDescription: string,
    httpStatus: number,
    rpcCode: number
  ): void {
    const origin = `${req.protocol}://${req.get("host")}`;
    const resourceMetadataUrl = `${origin}${RESOURCE_METADATA_PATH}`;

    res.setHeader(
      "WWW-Authenticate",
      `Bearer error="${errorCode}", error_description="${errorDescription}", resource_metadata="${resourceMetadataUrl}"`
    );
    res.status(httpStatus).json({
      jsonrpc: "2.0",
      error: {
        code: rpcCode,
        message: errorDescription,
      },
      id: null,
    });
  }
}
