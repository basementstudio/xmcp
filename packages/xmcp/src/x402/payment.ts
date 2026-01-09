import { getPaymentContext } from "./interceptor";
import type { X402PaymentContext } from "@/types/x402";

export function payment(): X402PaymentContext {
  const ctx = getPaymentContext();
  if (!ctx) {
    throw new Error(
      "payment() must be called inside a paid tool handler. " +
        "Ensure the tool is wrapped with paid() and has received a valid payment."
    );
  }
  return ctx;
}

export type { X402PaymentContext, PaidHandlerExtra } from "@/types/x402";
