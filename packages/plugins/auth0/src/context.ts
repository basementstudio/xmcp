import { createContext } from "xmcp";
import type { SessionContext, ClientContext } from "./types.js";

export const contextSession = createContext<SessionContext>({
  name: "auth0-context-session",
});

export const setSessionContext = contextSession.setContext;
export const getSessionContext = contextSession.getContext;
export const providerSessionContext = contextSession.provider;

export const contextClient = createContext<ClientContext>({
  name: "auth0-context-client",
});

export const setClientContext = contextClient.setContext;
export const getClientContext = contextClient.getContext;
export const providerClientContext = contextClient.provider;
