import type { ApiClient } from "@auth0/auth0-api-js";
import type { ManagementClient } from "auth0";
import { getClientContext } from "./context.js";

export function getClient(): ApiClient {
  const { apiClient } = getClientContext();
  if (!apiClient) {
    throw new Error(
      "[Auth0] Auth0 client not initialized. " +
        "Ensure this is called within an authenticated request context."
    );
  }
  return apiClient;
}

export function getManagement(): ManagementClient {
  const { managementClient } = getClientContext();
  if (!managementClient) {
    throw new Error(
      "[Auth0] Management client not initialized. " +
        "Ensure management config is provided and this is called within an authenticated request."
    );
  }
  return managementClient;
}
