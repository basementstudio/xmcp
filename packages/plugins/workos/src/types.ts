import type { IncomingHttpHeaders } from "http";
import type { WorkOS, User } from "@workos-inc/node";

/**
 * WorkOS plugin configuration
 */
export interface WorkOSConfig {
  /**
   * WorkOS API key from the dashboard
   */
  readonly apiKey: string;
  /**
   * WorkOS client ID for OAuth
   */
  readonly clientId: string;
  /**
   * Your AuthKit domain (e.g., "yourcompany.authkit.app")
   */
  readonly authkitDomain: string;
  /**
   * Base URL of your MCP server
   * Used for resource metadata endpoint
   */
  readonly baseURL: string;
}

/**
 * Internal config with initialized WorkOS client
 */
export interface WorkOSInternalConfig extends WorkOSConfig {
  /**
   * Initialized WorkOS SDK client instance
   */
  readonly client: WorkOS;
}

/**
 * JWT payload from a decoded WorkOS access token
 */
export interface JWTPayload {
  readonly sub?: string;
  readonly email?: string;
  readonly first_name?: string | null;
  readonly last_name?: string | null;
  readonly profile_picture_url?: string | null;
  readonly email_verified?: boolean;
  readonly org_id?: string;
  readonly created_at?: string;
  readonly updated_at?: string;
  readonly exp?: number;
  readonly iat?: number;
  readonly iss?: string;
  readonly aud?: string | string[];
  readonly act?: {
    readonly sub: string;
    readonly reason?: string;
  };
  readonly [key: string]: unknown;
}

/**
 * Session data returned by getWorkOSSession
 */
export interface WorkOSSession {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly user: User;
  readonly organizationId?: string;
  readonly impersonator?: {
    readonly email: string;
    readonly reason: string | null;
  };
}

/**
 * OAuth Protected Resource Metadata
 * Returned by /.well-known/oauth-protected-resource
 */
export interface ProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly bearer_methods_supported: readonly string[];
}

/**
 * Context stored for WorkOS authentication
 */
export interface WorkOSContext {
  readonly config: WorkOSInternalConfig;
  readonly headers: IncomingHttpHeaders;
  readonly payload?: JWTPayload;
}
