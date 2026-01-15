import { createContext } from "xmcp";
import type { X402PaymentContext, X402ToolContext } from "./types.js";
const paymentContext = createContext<X402PaymentContext>({
  name: "x402-payment",
});

export const x402ContextProvider = paymentContext.provider;
export const getX402PaymentContext = paymentContext.getContext;

const toolContext = createContext<X402ToolContext>({
  name: "x402-tool-context",
});

export const toolContextProvider = toolContext.provider;
export const getToolContext = toolContext.getContext;
