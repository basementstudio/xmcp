import { createContext } from "xmcp";
import type { MppPaymentContext, MppToolContext } from "./types.js";

const paymentContext = createContext<MppPaymentContext>({
  name: "mpp-payment",
});

export const mppContextProvider = paymentContext.provider;
export const getMppPaymentContext = paymentContext.getContext;

const toolContext = createContext<MppToolContext>({
  name: "mpp-tool-context",
});

export const toolContextProvider = toolContext.provider;
export const getToolContext = toolContext.getContext;
