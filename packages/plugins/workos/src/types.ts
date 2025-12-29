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
 * User information from WorkOS session
 */
export interface WorkOSUser {
  readonly id: string;
  readonly email: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly profilePictureUrl: string | null;
  readonly emailVerified: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Organization membership information
 */
export interface WorkOSOrganizationMembership {
  readonly id: string;
  readonly organizationId: string;
  readonly userId: string;
  readonly role: {
    readonly slug: string;
  };
  readonly status: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * Session data returned by getWorkOSSession
 */
export interface WorkOSSession {
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly user: WorkOSUser;
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
