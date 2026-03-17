import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  mixin,
  Type,
} from "@nestjs/common";
import { Request, Response } from "express";
import { buildResourceMetadataUrl } from "./xmcp.utils";

export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
}

export interface McpAuthConfig {
  /** Verify token and return auth info. Throw an error if invalid. */
  verifyToken: (
    token: string
  ) => Promise<Omit<AuthInfo, "token">> | Omit<AuthInfo, "token">;
  /** If true, requests without tokens will be rejected. Default: false */
  required?: boolean;
  /** Scopes required for access. If not provided, any valid token is accepted. */
  requiredScopes?: string[];
}

export function createMcpAuthGuard(config: McpAuthConfig): Type<CanActivate> {
  @Injectable()
  class McpAuthGuardMixin implements CanActivate {
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest<Request>();
      const response = context.switchToHttp().getResponse<Response>();
      const authHeader = request.headers.authorization;

      const resourceMetadataUrl = buildResourceMetadataUrl(request);

      // No token provided
      if (!authHeader?.startsWith("Bearer ")) {
        if (config.required) {
          const scopeParam = config.requiredScopes?.length
            ? `, scope="${config.requiredScopes.join(" ")}"`
            : "";
          response.setHeader(
            "WWW-Authenticate",
            `Bearer resource_metadata="${resourceMetadataUrl}"${scopeParam}`
          );
          throw new HttpException(
            "Authentication required",
            HttpStatus.UNAUTHORIZED
          );
        }
        return true; // Allow without auth
      }

      const token = authHeader.slice(7);

      try {
        const authResult = await config.verifyToken(token);

        // Check required scopes
        if (config.requiredScopes?.length) {
          const hasAllScopes = config.requiredScopes.every((scope) =>
            authResult.scopes.includes(scope)
          );
          if (!hasAllScopes) {
            response.setHeader(
              "WWW-Authenticate",
              `Bearer error="insufficient_scope", scope="${config.requiredScopes.join(" ")}", resource_metadata="${resourceMetadataUrl}"`
            );
            throw new HttpException("Insufficient scope", HttpStatus.FORBIDDEN);
          }
        }

        // Attach auth info to request
        (request as any).auth = {
          token,
          ...authResult,
        } satisfies AuthInfo;

        return true;
      } catch (error) {
        if (error instanceof HttpException) throw error;
        response.setHeader(
          "WWW-Authenticate",
          `Bearer error="invalid_token", resource_metadata="${resourceMetadataUrl}"`
        );
        throw new HttpException(
          error instanceof Error ? error.message : "Invalid token",
          HttpStatus.UNAUTHORIZED
        );
      }
    }
  }

  return mixin(McpAuthGuardMixin);
}
