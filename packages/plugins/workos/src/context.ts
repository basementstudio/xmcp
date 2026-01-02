import type { WorkOS } from "@workos-inc/node";
import { createContext } from "xmcp";
import type { WorkOSContext } from "./types.js";

export const workosContext = createContext<WorkOSContext>({
  name: "workos-context",
});

export const setWorkOSContext = workosContext.setContext;

export const getWorkOSContext = workosContext.getContext;

export const workosContextProvider = workosContext.provider;

export function getWorkOSClient(): WorkOS {
  const context = getWorkOSContext();

  if (!context) {
    throw new Error(
      "getWorkOSClient must be used within a workosProvider authenticated request"
    );
  }

  return context.config.client;
}
