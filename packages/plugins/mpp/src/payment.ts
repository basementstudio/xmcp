import { getMppPaymentContext } from "./context.js";
import type { MppPaymentContext } from "./types.js";

/**
 * Get the payment context for the current request.
 * Must be called inside a paid tool handler.
 *
 * Uses AsyncLocalStorage to safely handle concurrent requests.
 */
export function payment(): MppPaymentContext {
  try {
    return getMppPaymentContext();
  } catch {
    throw new Error(
      "payment() must be called inside a paid tool handler. " +
        "Ensure the tool is wrapped with paid() and has received a valid payment."
    );
  }
}
