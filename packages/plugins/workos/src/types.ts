import type { IncomingHttpHeaders } from "http";
import type { WorkOS, User } from "@workos-inc/node";
import type { JWTPayload } from "jose";

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

export interface WorkOSInternalConfig extends WorkOSConfig {
  readonly client: WorkOS;
}

export interface WorkOSJWTPayload extends JWTPayload {
  readonly sid?: string;
  readonly org_id?: string;
  readonly role?: string;
  readonly permissions?: readonly string[];
  readonly act?: {
    readonly sub: string;
    readonly reason?: string;
  };
}

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

export interface ProtectedResourceMetadata {
  readonly resource: string;
  readonly authorization_servers: readonly string[];
  readonly bearer_methods_supported: readonly string[];
}

export interface WorkOSContext {
  readonly config: WorkOSInternalConfig;
  readonly headers: IncomingHttpHeaders;
  readonly payload?: WorkOSJWTPayload;
}
