import { createContext } from "xmcp";
import type { AuthContext, ConfigContext } from "./types.js";

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
