import { createContext } from "xmcp";
import type { AuthContext, Auth0Context } from "./types.js";

export const contextSession = createContext<AuthContext>({
  name: "auth0-context-session",
});

export const setSessionContext = contextSession.setContext;
export const getSessionContext = contextSession.getContext;
export const providerSessionContext = contextSession.provider;

export const contextClient = createContext<Auth0Context>({
  name: "auth0-context-client",
});

export const setClientContext = contextClient.setContext;
export const getClientContext = contextClient.getContext;
export const providerClientContext = contextClient.provider;
