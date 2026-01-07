import { createContext } from "xmcp";
import type { ClerkClientContext } from "./types.js";
import type { ClerkSessionContext } from "./types.js";

export const clerkContextSession = createContext<ClerkSessionContext>({
  name: "clerk-context-session",
});

export const clerkContextClient = createContext<ClerkClientContext>({
  name: "clerk-context-client",
});

export const setClerkContextSession = clerkContextSession.setContext;
export const getClerkContextSession = clerkContextSession.getContext;
export const clerkContextProviderSession = clerkContextSession.provider;

export const setClerkContextClient = clerkContextClient.setContext;
export const getClerkContextClient = clerkContextClient.getContext;
export const clerkContextProviderClient = clerkContextClient.provider;