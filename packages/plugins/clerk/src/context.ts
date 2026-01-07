import { createContext } from "xmcp";
import type { ClientContext } from "./types.js";
import type { SessionContext } from "./types.js";

export const contextSession = createContext<SessionContext>({
  name: "clerk-context-session",
});

export const contextClient = createContext<ClientContext>({
  name: "clerk-context-client",
});

export const setContextSession = contextSession.setContext;
export const getContextSession = contextSession.getContext;
export const contextProviderSession = contextSession.provider;

export const setContextClient = contextClient.setContext;
export const getContextClient = contextClient.getContext;
export const contextProviderClient = contextClient.provider;