import { getX402PaymentContext } from "./context.js";
import type { X402PaymentContext } from "./types.js";

/**
 * Get the payment context for the current request.
 * Must be called inside a paid tool handler.
 *
 * Uses AsyncLocalStorage to safely handle concurrent requests.
 */
export function payment(): X402PaymentContext {
  const ctx = getX402PaymentContext();
  if (!ctx) {
    throw new Error(
      "payment() must be called inside a paid tool handler. " +
        "Ensure the tool is wrapped with paid() and has received a valid payment."
    );
  }
  return ctx;
}

export type { X402PaymentContext, PaidHandlerExtra } from "./types.js";
