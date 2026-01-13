import { createContext } from "xmcp";
import type { ClientContext } from "./types.js";
import type { SessionContext } from "./types.js";

export const contextSession = createContext<SessionContext>({
  name: "clerk-context-session",
});

export const contextClient = createContext<ClientContext>({
  name: "clerk-context-client",
});

export const setSessionContext = contextSession.setContext;
export const getSessionContext = contextSession.getContext;
export const providerSessionContext = contextSession.provider;

export const setClientContext = contextClient.setContext;
export const getClientContext = contextClient.getContext;
export const providerClientContext = contextClient.provider;