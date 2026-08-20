export const nestJsTypeDefinition = `
import { Request, Response } from "express";
import { Type, CanActivate, DynamicModule } from "@nestjs/common";

// Auth types
export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
}

export interface McpAuthConfig {
  verifyToken: (token: string) => Promise<Omit<AuthInfo, "token">> | Omit<AuthInfo, "token">;
  required?: boolean;
  requiredScopes?: string[];
}

export declare function createMcpAuthGuard(config: McpAuthConfig): Type<CanActivate>;

// OAuth types
export interface OAuthConfig {
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

export interface OAuthProtectedResourceMetadata {
  resource: string;
  authorizationServers: string[];
  scopesSupported?: string[];
  bearerMethodsSupported?: string[];
}

export declare class OAuthModule {
  static forRoot(config: OAuthConfig): DynamicModule;
}

export declare class OAuthService {
  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata;
}

export declare class OAuthController {
  constructor(oauthService: OAuthService);
  getResourceMetadata(req: Request): OAuthProtectedResourceMetadata;
  handleOptions(res: Response): void;
}

// Utility functions
export declare function buildBaseUrl(req: Request): string;
export declare function buildResourceMetadataUrl(req: Request): string;

// MCP Service & Controller
export declare class XmcpService {
  handleRequest(req: Request & { auth?: AuthInfo }, res: Response): Promise<void>;
}

export declare class XmcpController {
  constructor(xmcpService: XmcpService);
  handleMcp(req: Request, res: Response): Promise<void>;
  handleGet(res: Response): void;
  handleOptions(res: Response): void;
}
`;
