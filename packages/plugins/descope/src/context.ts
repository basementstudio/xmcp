import { createContext } from "xmcp";
import type { DescopeSession } from "./types.js";
import type nodeSdk from "@descope/node-sdk";

type DescopeClient = ReturnType<typeof nodeSdk>;

export const contextSession = createContext<{ session: DescopeSession | null }>({
  name: "descope-context-session",
});
export const { getContext: getSessionContext, provider: providerSessionContext } = contextSession;

export const contextClient = createContext<{ client: DescopeClient; managementKey?: string }>({
  name: "descope-context-client",
});
export const { getContext: getClientContext, provider: providerClientContext } = contextClient;

export type { DescopeClient };
