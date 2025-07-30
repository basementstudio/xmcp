import { IncomingHttpHeaders } from "http";
import { BetterAuthInstanceWithMcp } from "./better-auth.js";
import { createContext } from "./context.js";

interface BetterAuthContext {
  api: BetterAuthInstanceWithMcp["api"];
  headers: IncomingHttpHeaders;
}

export const betterAuthContext = createContext<BetterAuthContext>({
  name: "better-auth-context",
});

export const setBetterAuthContext = betterAuthContext.setContext;

export const getBetterAuthContext = betterAuthContext.getContext;

export const betterAuthContextProvider = betterAuthContext.provider;
