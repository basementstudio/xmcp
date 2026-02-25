import type { ManagementClient } from "auth0";

/**
 * Fetches scopes defined for the resource server from Auth0.
 * Called on every request (serverless - no persistent cache).
 */
export async function fetchResourceServerScopes(
  managementClient: ManagementClient,
  audience: string
): Promise<Set<string>> {
  const resourceServer = await managementClient.resourceServers.get(audience);

  const scopes = new Set<string>();
  if (resourceServer.scopes && Array.isArray(resourceServer.scopes)) {
    for (const scope of resourceServer.scopes) {
      if (scope.value && typeof scope.value === "string") {
        scopes.add(scope.value);
      }
    }
  }
  return scopes;
}

/**
 * Checks if a specific tool permission is defined in Auth0.
 * Returns: true (defined), false (not defined), null (couldn't check)
 */
export async function isToolPermissionDefined(
  managementClient: ManagementClient | null,
  audience: string,
  toolName: string
): Promise<boolean | null> {
  if (!managementClient) {
    return null;
  }

  try {
    const scopes = await fetchResourceServerScopes(managementClient, audience);
    return scopes.has(`tool:${toolName}`);
  } catch (error) {
    console.error("[Auth0] Failed to fetch resource server scopes:", error);
    return null;
  }
}

/**
 * Fetches all permissions assigned to a user from Auth0.
 * Returns a Set of permission names (e.g., "tool:greet").
 */
export async function fetchUserPermissions(
  managementClient: ManagementClient,
  userId: string,
  audience: string
): Promise<Set<string>> {
  const permissions = new Set<string>();

  // Fetch user permissions with pagination
  const response = await managementClient.users.permissions.list(userId, {
    per_page: 100,
  });

  // Filter to only include permissions for our API (audience)
  for (const permission of response.data) {
    if (
      permission.resource_server_identifier === audience &&
      permission.permission_name
    ) {
      permissions.add(permission.permission_name);
    }
  }

  return permissions;
}

/**
 * Checks if a user has a specific tool permission in Auth0.
 * Returns: true (has permission), false (doesn't have), null (couldn't check)
 */
export async function userHasToolPermission(
  managementClient: ManagementClient | null,
  userId: string,
  audience: string,
  toolName: string
): Promise<boolean | null> {
  if (!managementClient) {
    return null;
  }

  try {
    const permissions = await fetchUserPermissions(
      managementClient,
      userId,
      audience
    );
    return permissions.has(`tool:${toolName}`);
  } catch (error) {
    console.error("[Auth0] Failed to fetch user permissions:", error);
    return null;
  }
}
