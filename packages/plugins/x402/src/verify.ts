import type {
  X402Config,
  X402PaymentContext,
  PaymentRequirements,
  PaymentPayload,
} from "./types.js";
import type { PaymentRequirements as PaymentRequirementsV2 } from "@x402/core/types";
import { log } from "./logger.js";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { decodePaymentSignatureHeader } from "@x402/core/http";
import {
  NETWORKS,
  NANO_NETWORK_ID,
  DEFAULT_FACILITATOR_URL,
  DEFAULT_NANO_RPC_URL,
} from "./constants.js";
import { getToolContext } from "./context.js";
import { createNanoRpc, verifyNanoPayment } from "./nano.js";

/**
 * Convert a decimal price into atomic units of an asset with `decimals`
 * decimals (6 for USDC, 30 for XNO). The price is converted from its decimal
 * string form with BigInt so large decimal counts do not lose precision.
 * Digits beyond `decimals` are rounded half up.
 */
export function priceToAtomicUnits(price: number, decimals: number): string {
  const match = /^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i.exec(String(price));
  if (!Number.isFinite(price) || !match) {
    throw new Error(`Invalid price: ${price}`);
  }

  const [, whole, fraction = "", exponent = "0"] = match;
  const digits = BigInt(whole + fraction);
  const scale = decimals + Number(exponent) - fraction.length;

  if (scale >= 0) {
    return (digits * 10n ** BigInt(scale)).toString();
  }

  const divisor = 10n ** BigInt(-scale);
  const quotient = digits / divisor;
  const roundUp = (digits % divisor) * 2n >= divisor;
  return (roundUp ? quotient + 1n : quotient).toString();
}

function resolveNetwork() {
  const { toolOptions, config } = getToolContext();
  const networkName = toolOptions.network ?? config.defaults?.network ?? "base";
  const networkConfig = NETWORKS[networkName];

  if (!networkConfig) {
    throw new Error(
      `Unsupported network: ${networkName}. Supported: ${Object.keys(NETWORKS).join(", ")}`
    );
  }

  return { networkName, networkConfig };
}

/**
 * Create payment requirements for a paid tool
 */
export function createPaymentRequirements(useV2Format: boolean = false) {
  const { toolName, toolOptions, config } = getToolContext();

  const { networkName, networkConfig } = resolveNetwork();
  const price = toolOptions.price ?? config.defaults?.price ?? 0.01;
  const amount = priceToAtomicUnits(price, networkConfig.decimals);
  const payTo =
    networkConfig.id === NANO_NETWORK_ID
      ? (config.nano?.wallet ?? config.wallet)
      : config.wallet;

  if (useV2Format) {
    return {
      scheme: "exact",
      network: networkConfig.id,
      amount,
      payTo,
      asset: networkConfig.asset,
      maxTimeoutSeconds:
        toolOptions.maxPaymentAge ?? config.defaults?.maxPaymentAge ?? 300,
      extra: networkConfig.extra,
    };
  }

  // V1 format: network name, "maxAmountRequired" field
  return {
    scheme: "exact",
    network: networkName,
    maxAmountRequired: amount,
    payTo,
    asset: networkConfig.asset,
    maxTimeoutSeconds:
      toolOptions.maxPaymentAge ?? config.defaults?.maxPaymentAge ?? 300,
    resource: `mcp://tool/${toolName}`,
    mimeType: "application/json",
    description: toolOptions.description ?? `Access to ${toolName} tool`,
    extra: networkConfig.extra,
  };
}

/**
 * Create the 402 Payment Required response body
 */
export function createPaymentRequiredResponse(
  error?: string,
  useV2Format: boolean = false
) {
  const requirements = createPaymentRequirements(useV2Format);

  return {
    x402Version: useV2Format ? 2 : 1,
    error: error ?? "Payment required",
    accepts: [requirements],
  };
}

type VerificationResult = {
  valid: boolean;
  context?: X402PaymentContext;
  error?: string;
  payload?: PaymentPayload;
  requirements?: PaymentRequirements;
  isV2Format?: boolean;
  /** Frees a locally claimed payment so it can be retried, e.g. when the tool fails */
  release?: () => void;
};

const defaultNanoBlocks = new Set<string>();

/**
 * Verify payment with facilitator, or locally against a Nano node for `nano`
 */
export async function verifyPayment(
  paymentHeader: string
): Promise<VerificationResult> {
  const { toolName, config } = getToolContext();

  try {
    const payload = decodePaymentSignatureHeader(paymentHeader);

    const isV2Format = payload.x402Version !== 1;

    const requirements = createPaymentRequirements(isV2Format);

    const debug = config.debug ?? false;
    log(debug, "Verifying payment...");
    log(debug, "Payload:", payload);
    log(debug, "Requirements:", requirements);

    if (resolveNetwork().networkConfig.id === NANO_NETWORK_ID) {
      return verifyNano(payload, requirements, isV2Format);
    }

    const facilitatorUrl = config.facilitator || DEFAULT_FACILITATOR_URL;
    log(debug, "Facilitator URL:", facilitatorUrl);

    const facilitator = new HTTPFacilitatorClient({
      url: facilitatorUrl,
    });

    const result = await facilitator.verify(payload, requirements as any);

    log(debug, "Verification result:", result);

    if (!result.isValid) {
      log(debug, "Payment invalid:", result.invalidReason);
      return {
        valid: false,
        error: result.invalidReason ?? "Payment verification failed",
        isV2Format,
      };
    }

    log(debug, "Payment verified successfully for payer:", result.payer);

    return {
      valid: true,
      context: {
        payer: result.payer ?? "",
        amount: requirements.amount ?? requirements.maxAmountRequired,
        network: requirements.network,
        asset: requirements.asset,
        toolName,
      },
      payload,
      requirements: requirements as PaymentRequirements,
      isV2Format,
    };
  } catch (error) {
    return {
      valid: false,
      error:
        error instanceof Error ? error.message : "Payment verification failed",
    };
  }
}

/**
 * Nano has no facilitator. The payment payload carries the hash of a send
 * block the payer already published; it is checked against a Nano node and
 * claimed in the provider's used-block store so it cannot pay twice.
 */
async function verifyNano(
  payload: PaymentPayload,
  requirements: ReturnType<typeof createPaymentRequirements>,
  isV2Format: boolean
): Promise<VerificationResult> {
  const { toolName, config, nanoBlocks } = getToolContext();
  const usedBlocks = nanoBlocks ?? defaultNanoBlocks;
  const rpcOption = config.nano?.rpc ?? DEFAULT_NANO_RPC_URL;
  const rpc =
    typeof rpcOption === "function" ? rpcOption : createNanoRpc(rpcOption);

  const result = await verifyNanoPayment({
    blockHash: (payload.payload as Record<string, unknown> | undefined)
      ?.blockHash,
    payTo: requirements.payTo,
    amount: requirements.amount ?? requirements.maxAmountRequired,
    rpc,
    usedBlocks,
    maxPaymentAgeSeconds: requirements.maxTimeoutSeconds,
  });

  log(config.debug ?? false, "Nano verification result:", result);

  if (!result.valid) {
    return { valid: false, error: result.error, isV2Format };
  }

  return {
    valid: true,
    context: {
      payer: result.payer,
      amount: result.amount,
      network: requirements.network,
      asset: requirements.asset,
      transactionHash: result.blockHash,
      toolName,
    },
    payload,
    requirements: requirements as PaymentRequirements,
    isV2Format,
    release: () => usedBlocks.delete(result.blockHash),
  };
}

/**
 * Settle payment after successful tool execution
 */
export async function settlePayment(
  payload: PaymentPayload,
  requirements: PaymentRequirements,
  context?: X402PaymentContext
): Promise<{
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
}> {
  // A verified Nano send block is already final on the ledger
  if (networkIdOf(requirements.network) === NANO_NETWORK_ID) {
    return {
      success: true,
      transaction: context?.transactionHash,
      network: NANO_NETWORK_ID,
      payer: context?.payer,
    };
  }

  const { config } = getToolContext();
  const facilitatorUrl = config.facilitator || DEFAULT_FACILITATOR_URL;

  const facilitator = new HTTPFacilitatorClient({
    url: facilitatorUrl,
  });

  return facilitator.settle(payload, requirements as PaymentRequirementsV2);
}

/**
 * Map a V1 network name or a V2 network id to the V2 network id
 */
export function networkIdOf(network: string): string {
  return NETWORKS[network]?.id ?? network;
}

/**
 * Encode settlement response for X-PAYMENT-RESPONSE header
 */
export function encodeSettlementHeader(
  settlement: {
    success: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  },
  requirements: PaymentRequirements
): string {
  const response = {
    ...settlement,
    requirements,
  };
  return Buffer.from(JSON.stringify(response)).toString("base64");
}
