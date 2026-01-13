import type { ApiClient } from "@auth0/auth0-api-js";
import type { ManagementClient } from "auth0";
import { getApiClientContext, getManagementClientContext } from "./context.js";

/**
 * Get the Auth0 API client for token operations.
 * This is the @auth0/auth0-api-js ApiClient instance.
 */
export function getAuth0Client(): ApiClient {
  const { apiClient } = getApiClientContext();
  if (!apiClient) {
    throw new Error(
      "[Auth0] Auth0 client not initialized. " +
        "Ensure this is called within an authenticated request context."
    );
  }
  return apiClient;
}

/**
 * Get the Auth0 Management API client for user/role operations.
 * This is the official Auth0 Node.js SDK ManagementClient.
 * @see https://auth0.github.io/node-auth0/
 */
export function getManagementClient(): ManagementClient {
  const { managementClient } = getManagementClientContext();
  if (!managementClient) {
    throw new Error(
      "[Auth0] Management client not initialized. " +
        "Ensure management config is provided and this is called within an authenticated request."
    );
  }
  return managementClient;
}
