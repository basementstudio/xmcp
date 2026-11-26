/**
 * The payer side of tools on `nano`, for MCP clients.
 *
 * A paid tool answers an unpaid `tools/call` with a 402 offer.
 * `planNanoPayment` reads that offer and returns what the payer's own wallet
 * has to send: exactly `amountRaw` to `payTo`, with the send block's
 * representative set to `representative` when the offer is bound to an order
 * (xno-binding v1). Once the wallet has published that send,
 * `nanoPaymentPayload` builds the payment to put in `_meta["x402/payment"]`
 * of the retried call.
 *
 * Nothing here signs, holds a key or talks to a node: signing and publishing
 * stay with the payer's wallet.
 */

import { NANO_NETWORK_ID } from "./constants.js";
import {
  NANO_BINDING_V1,
  isValidNanoAddress,
  isValidNanoOrderId,
  nanoOrderCommitment,
} from "./nano.js";

/** What the payer's wallet has to send to pay one 402 offer on `nano` */
export interface NanoPaymentPlan {
  /** x402 version of the offer; the payment is made in the same version */
  x402Version: 1 | 2;
  /** The `accepts` entry that is paid */
  accepted: Record<string, unknown>;
  /** Top-level `resource` of an x402 v2 offer */
  resource?: unknown;
  /** `nano_` account that receives the payment */
  payTo: string;
  /** Exact amount to send, in raw (1 XNO = 10^30 raw) */
  amountRaw: string;
  /** Representative the send block must carry, when the offer is bound */
  representative?: string;
  /** Order id of a bound offer, returned with the payment */
  orderId?: string;
}

export interface PlanNanoPaymentOptions {
  /** Most the payer pays for one call, in raw; a higher offer is refused */
  maxAmountRaw: bigint | string;
  /** When given, an offer whose `payTo` is not in this list is refused */
  allowedPayees?: readonly string[];
}

const NANO_NETWORKS = new Set(["nano", NANO_NETWORK_ID]);
const RAW_PATTERN = /^[1-9][0-9]*$/;
const MAX_RAW = (1n << 128n) - 1n;
const BLOCK_HASH_PATTERN = /^[0-9A-Fa-f]{64}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRaw(value: unknown, name: string): bigint {
  const text = typeof value === "bigint" ? value.toString() : value;
  if (typeof text !== "string" || !RAW_PATTERN.test(text)) {
    throw new Error(`${name} must be a positive whole number of raw`);
  }
  const raw = BigInt(text);
  if (raw > MAX_RAW) throw new Error(`${name} is larger than any Nano balance`);
  return raw;
}

/**
 * The 402 offer from what a paid tool returned: the offer itself, the JSON
 * text of it, or the `tools/call` result carrying it in `structuredContent`
 * or in its first text content
 */
function readOffer(
  paymentRequired: unknown
): Record<string, unknown> & { accepts: unknown[] } {
  let value = paymentRequired;
  if (typeof value === "string") value = JSON.parse(value);
  if (isRecord(value) && !Array.isArray(value.accepts)) {
    if (isRecord(value.structuredContent)) {
      value = value.structuredContent;
    } else if (Array.isArray(value.content)) {
      const text = value.content.find(
        (item): item is { type: "text"; text: string } =>
          isRecord(item) &&
          item.type === "text" &&
          typeof item.text === "string"
      );
      if (text) value = JSON.parse(text.text);
    }
  }
  if (!isRecord(value) || !Array.isArray(value.accepts)) {
    throw new Error("Not an x402 offer: no accepts list");
  }
  return value as Record<string, unknown> & { accepts: unknown[] };
}

/**
 * Read a 402 offer and plan the Nano payment for it. Refuses an offer with
 * no `exact` entry on `nano`, an invalid or unexpected `payTo`, an amount
 * above `maxAmountRaw`, and a binding this version does not know, so the
 * wallet is never asked to send a payment the server would not accept.
 */
export async function planNanoPayment(
  paymentRequired: unknown,
  options: PlanNanoPaymentOptions
): Promise<NanoPaymentPlan> {
  const offer = readOffer(paymentRequired);
  const maxAmount = parseRaw(options.maxAmountRaw, "maxAmountRaw");
  const x402Version = offer.x402Version === 2 ? 2 : 1;

  const accepted = offer.accepts.find(
    (entry): entry is Record<string, unknown> =>
      isRecord(entry) &&
      entry.scheme === "exact" &&
      typeof entry.network === "string" &&
      NANO_NETWORKS.has(entry.network)
  );
  if (!accepted) throw new Error("The offer has no exact payment on nano");

  const payTo = accepted.payTo;
  if (typeof payTo !== "string" || !isValidNanoAddress(payTo)) {
    throw new Error("The offer's payTo is not a valid nano_ address");
  }
  if (options.allowedPayees && !options.allowedPayees.includes(payTo)) {
    throw new Error(`The offer pays ${payTo}, which is not an allowed payee`);
  }

  const amount = parseRaw(
    x402Version === 2 ? accepted.amount : accepted.maxAmountRequired,
    "The offer's amount"
  );
  if (amount > maxAmount) {
    throw new Error(
      `The offer asks ${amount} raw, more than maxAmountRaw ${maxAmount}`
    );
  }
  const amountRaw = amount.toString();

  const plan: NanoPaymentPlan = { x402Version, accepted, payTo, amountRaw };
  if (x402Version === 2 && offer.resource !== undefined) {
    plan.resource = offer.resource;
  }

  const extra = isRecord(accepted.extra) ? accepted.extra : {};
  if (extra.binding !== undefined) {
    if (extra.binding !== NANO_BINDING_V1) {
      throw new Error(`Unknown Nano binding: ${String(extra.binding)}`);
    }
    if (!isValidNanoOrderId(extra.orderId)) {
      throw new Error("The bound offer has no valid orderId");
    }
    plan.orderId = extra.orderId;
    plan.representative = await nanoOrderCommitment(
      extra.orderId,
      payTo,
      amountRaw
    );
  }
  return plan;
}

/**
 * The payment for a planned offer, once the payer's wallet has published
 * the send: put it in `_meta["x402/payment"]` of the retried `tools/call`.
 */
export function nanoPaymentPayload(
  plan: NanoPaymentPlan,
  blockHash: string
): Record<string, unknown> {
  if (!BLOCK_HASH_PATTERN.test(blockHash)) {
    throw new Error("blockHash must be 64 hex characters");
  }
  const payload: Record<string, string> = {
    blockHash: blockHash.toUpperCase(),
  };
  if (plan.orderId !== undefined) payload.orderId = plan.orderId;

  if (plan.x402Version === 2) {
    return {
      x402Version: 2,
      ...(plan.resource !== undefined ? { resource: plan.resource } : {}),
      accepted: plan.accepted,
      payload,
    };
  }
  return {
    x402Version: 1,
    scheme: "exact",
    network: plan.accepted.network,
    payload,
  };
}
