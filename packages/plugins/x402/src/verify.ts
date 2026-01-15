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
import { NETWORKS, USDC_EXTRA, DEFAULT_FACILITATOR_URL } from "./constants.js";
import { getToolContext } from "./context.js";

/**
 * Convert price to atomic units (6 decimals for USDC)
 */
function priceToAtomicUnits(price: number): string {
  return Math.round(price * 1_000_000).toString();
}

/**
 * Create payment requirements for a paid tool
 */
export function createPaymentRequirements(useV2Format: boolean = false) {
  const { toolName, toolOptions, config } = getToolContext();

  const networkName = toolOptions.network ?? config.defaults?.network ?? "base";
  const networkConfig = NETWORKS[networkName];
  const price = toolOptions.price ?? config.defaults?.price ?? 0.01;

  if (!networkConfig) {
    throw new Error(
      `Unsupported network: ${networkName}. Supported: ${Object.keys(NETWORKS).join(", ")}`
    );
  }

  if (useV2Format) {
    return {
      scheme: "exact",
      network: networkConfig.id,
      amount: priceToAtomicUnits(price),
      payTo: config.wallet,
      asset: networkConfig.usdc,
      maxTimeoutSeconds:
        toolOptions.maxPaymentAge ?? config.defaults?.maxPaymentAge ?? 300,
      extra: USDC_EXTRA,
    };
  }

  // V1 format: network name, "maxAmountRequired" field
  return {
    scheme: "exact",
    network: networkName,
    maxAmountRequired: priceToAtomicUnits(price),
    payTo: config.wallet,
    asset: networkConfig.usdc,
    maxTimeoutSeconds:
      toolOptions.maxPaymentAge ?? config.defaults?.maxPaymentAge ?? 300,
    resource: `mcp://tool/${toolName}`,
    mimeType: "application/json",
    description: toolOptions.description ?? `Access to ${toolName} tool`,
    extra: USDC_EXTRA,
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

/**
 * Verify payment with facilitator
 */
export async function verifyPayment(paymentHeader: string): Promise<{
  valid: boolean;
  context?: X402PaymentContext;
  error?: string;
  payload?: PaymentPayload;
  requirements?: PaymentRequirements;
  isV2Format?: boolean;
}> {
  const { toolName, config } = getToolContext();

  try {
    const payload = decodePaymentSignatureHeader(paymentHeader);

    const isV2Format = payload.x402Version !== 1;

    const requirements = createPaymentRequirements(isV2Format);

    const debug = config.debug ?? false;
    log(debug, "Verifying payment...");
    log(debug, "Payload:", payload);
    log(debug, "Requirements:", requirements);

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
 * Settle payment after successful tool execution
 */
export async function settlePayment(
  payload: PaymentPayload,
  requirements: PaymentRequirements
): Promise<{
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
}> {
  const { config } = getToolContext();
  const facilitatorUrl = config.facilitator || DEFAULT_FACILITATOR_URL;

  const facilitator = new HTTPFacilitatorClient({
    url: facilitatorUrl,
  });

  return facilitator.settle(payload, requirements as PaymentRequirementsV2);
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
