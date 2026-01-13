import { createContext } from "xmcp";
import type {
  AuthContext,
  ConfigContext,
  ApiClientContext,
  ManagementClientContext,
} from "./types.js";

/**
 * Context for storing authentication information during request processing
 */
export const authContext = createContext<AuthContext>({
  name: "auth0-context",
});

export const setAuthContext = authContext.setContext;
export const getAuthContext = authContext.getContext;
export const contextProviderAuth = authContext.provider;

/**
 * Context for storing Auth0 configuration
 */
export const configContext = createContext<ConfigContext>({
  name: "auth0-config-context",
});

export const setConfigContext = configContext.setContext;
export const getConfigContext = configContext.getContext;
export const contextProviderConfig = configContext.provider;

/**
 * Context for storing the Auth0 API client (token verification)
 */
export const apiClientContext = createContext<ApiClientContext>({
  name: "auth0-context-api-client",
});

export const setApiClientContext = apiClientContext.setContext;
export const getApiClientContext = apiClientContext.getContext;
export const contextProviderApiClient = apiClientContext.provider;

/**
 * Context for storing the Auth0 Management API client
 */
export const managementClientContext = createContext<ManagementClientContext>({
  name: "auth0-context-management-client",
});

export const setManagementClientContext = managementClientContext.setContext;
export const getManagementClientContext = managementClientContext.getContext;
export const contextProviderManagementClient = managementClientContext.provider;
