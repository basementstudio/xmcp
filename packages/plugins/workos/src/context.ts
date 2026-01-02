import { IncomingHttpHeaders } from "http";
import { createContext } from "xmcp";
import type { WorkOSSession } from "./types.js";

/**
 * Context interface for WorkOS session data
 */
interface WorkOSContext {
  session: WorkOSSession | null;
  headers: IncomingHttpHeaders;
}

/**
 * Create the WorkOS context using xmcp's AsyncLocalStorage-based createContext
 */
export const workosContext = createContext<WorkOSContext>({
  name: "workos-context",
});

export const setWorkOSContext = workosContext.setContext;
export const getWorkOSContext = workosContext.getContext;
export const workosContextProvider = workosContext.provider;
