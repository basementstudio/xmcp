import { createContext } from "xmcp";
import type { WorkOSContextSession, WorkOSContextClient } from "./types.js";


export const workosSessionContext = createContext<WorkOSContextSession>({
  name: "workos-context",
});

export const workosClientContext = createContext<WorkOSContextClient>({
  name: "workos-context-client",
});

export const setWorkOSSessionContext = workosSessionContext.setContext;
export const getWorkOSSessionContext = workosSessionContext.getContext;
export const workosSessionContextProvider = workosSessionContext.provider;
export const setWorkOSClientContext = workosClientContext.setContext;
export const getWorkOSClientContext = workosClientContext.getContext;
export const workosClientContextProvider = workosClientContext.provider;