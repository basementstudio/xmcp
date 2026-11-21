import { encodePaymentSignatureHeader } from "@x402/core/http";

/**
 * Normalize the payment a client put in a `tools/call` request to the base64
 * header form that verification decodes.
 *
 * The x402 MCP transport sends the PaymentPayload in `_meta["x402/payment"]`
 * as a JSON object; older clients send it already base64-encoded. A string is
 * passed through unchanged, an object is encoded, anything else is treated as
 * no payment.
 */
export function toPaymentHeader(payment: unknown): string | undefined {
  if (typeof payment === "string") return payment;
  if (
    typeof payment === "object" &&
    payment !== null &&
    !Array.isArray(payment)
  ) {
    return encodePaymentSignatureHeader(
      payment as Parameters<typeof encodePaymentSignatureHeader>[0]
    );
  }
  return undefined;
}
