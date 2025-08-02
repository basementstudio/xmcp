import { IncomingHttpHeaders } from "http";
import { BetterAuthInstanceWithMcp } from "./provider.js";
import { createContext } from "xmcp/dist/utils";

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
