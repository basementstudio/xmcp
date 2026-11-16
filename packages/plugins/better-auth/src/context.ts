import { IncomingHttpHeaders } from "http";
import { BetterAuthInstanceWithMcp } from "./provider.js";
import { BetterAuthSession } from "./types.js";
import { createContext } from "xmcp";

interface BetterAuthContext {
  api: BetterAuthInstanceWithMcp["api"];
  headers: IncomingHttpHeaders;
  session?: BetterAuthSession;
}

export const betterAuthContext = createContext<BetterAuthContext>({
  name: "better-auth-context",
});

export const setBetterAuthContext = betterAuthContext.setContext;

export const getBetterAuthContext = betterAuthContext.getContext;

export const betterAuthContextProvider = betterAuthContext.provider;
