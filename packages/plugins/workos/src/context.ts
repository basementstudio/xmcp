import { createContext } from "xmcp";
import type { WorkOSContext } from "./types.js";


export const workosContext = createContext<WorkOSContext>({
  name: "workos-context",
});

export const setWorkOSContext = workosContext.setContext;
export const getWorkOSContext = workosContext.getContext;
export const workosContextProvider = workosContext.provider;
