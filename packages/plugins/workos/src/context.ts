import { createContext } from "xmcp";
import type { SessionContext, ClientContext } from "./types.js";


export const sessionContext = createContext<SessionContext>({
  name: "workos-context-session",
});

export const clientContext = createContext<ClientContext>({
  name: "workos-context-client",
});

export const setSessionContext = sessionContext.setContext;
export const getSessionContext = sessionContext.getContext;
export const contextProviderSession = sessionContext.provider;
export const setClientContext = clientContext.setContext;
export const getClientContext = clientContext.getContext;
export const contextProviderClient = clientContext.provider;