import { createContext } from "xmcp";
import type { X402PaymentContext } from "./types.js";

const paymentContext = createContext<X402PaymentContext>({
  name: "x402-payment",
});

export const x402ContextProvider = paymentContext.provider;

export const getX402PaymentContext = paymentContext.getContext;
