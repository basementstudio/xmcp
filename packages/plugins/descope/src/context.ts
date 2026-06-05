import { createContext } from "xmcp";
import type { DescopeSession } from "./types.js";
import type nodeSdk from "@descope/node-sdk";

type DescopeClient = ReturnType<typeof nodeSdk>;

const contextSession = createContext<{ session: DescopeSession | null }>({
  name: "descope-context-session",
});
export const getSessionContext = contextSession.getContext;
export const providerSessionContext = contextSession.provider;

const contextClient = createContext<{ client: DescopeClient; managementKey?: string }>({
  name: "descope-context-client",
});
export const getClientContext = contextClient.getContext;
export const providerClientContext = contextClient.provider;

export type { DescopeClient };
