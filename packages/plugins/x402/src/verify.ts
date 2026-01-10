import type {
  X402Config,
  X402ToolOptions,
  X402PaymentContext,
} from "./types.js";

// USDC contract addresses by network
const USDC_ADDRESSES: Record<string, string> = {
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
};

// Default EIP-712 domain for USDC
const USDC_EXTRA = { name: "USDC", version: "2" };

/**
 * Parse price string to atomic units (6 decimals for USDC)
 */
function priceToAtomicUnits(price: string): string {
  const numericPrice = price.replace(/[^0-9.]/g, "");
  const amount = parseFloat(numericPrice);
  return Math.floor(amount * 1_000_000).toString();
}

/**
 * Create payment requirements for a paid tool
 * Compatible with x402-mcp client expectations
 */
export function createPaymentRequirements(
  toolName: string,
  toolOptions: X402ToolOptions,
  config: X402Config
) {
  const network = toolOptions.network ?? config.defaults?.network ?? "base";
  const price = toolOptions.price ?? config.defaults?.price ?? "0.01";
  const asset = USDC_ADDRESSES[network];

  if (!asset) {
    throw new Error(
      `Unsupported network: ${network}. Supported: ${Object.keys(USDC_ADDRESSES).join(", ")}`
    );
  }

  return {
    scheme: "exact",
    network,
    maxAmountRequired: priceToAtomicUnits(price),
    payTo: config.wallet,
    asset,
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
  toolName: string,
  toolOptions: X402ToolOptions,
  config: X402Config,
  error?: string
) {
  const requirements = createPaymentRequirements(toolName, toolOptions, config);

  return {
    x402Version: 1,
    error: error ?? "Payment required",
    accepts: [requirements],
  };
}

// Default facilitator URL (testnet)
const DEFAULT_FACILITATOR_URL = "https://x402.org/facilitator";

// Lazy-loaded x402 modules
let _x402Server: any = null;
let _x402Http: any = null;

async function getX402Server() {
  if (!_x402Server) {
    _x402Server = await import("@x402/core/server");
  }
  return _x402Server;
}

async function getX402Http() {
  if (!_x402Http) {
    _x402Http = await import("@x402/core/http");
  }
  return _x402Http;
}

/**
 * Decode the X-PAYMENT header
 */
export async function decodePaymentHeader(header: string): Promise<any> {
  const http = await getX402Http();
  return http.decodePaymentSignatureHeader(header);
}

/**
 * Verify payment with facilitator
 */
export async function verifyPayment(
  paymentHeader: string,
  toolName: string,
  toolOptions: X402ToolOptions,
  config: X402Config
): Promise<{
  valid: boolean;
  context?: X402PaymentContext;
  error?: string;
  payload?: any;
  requirements?: ReturnType<typeof createPaymentRequirements>;
}> {
  try {
    const server = await getX402Server();
    const http = await getX402Http();

    const payload = http.decodePaymentSignatureHeader(paymentHeader);
    const requirements = createPaymentRequirements(
      toolName,
      toolOptions,
      config
    );

    console.log("[x402] Verifying payment...");
    console.log("[x402] Payload:", JSON.stringify(payload, null, 2));
    console.log("[x402] Requirements:", JSON.stringify(requirements, null, 2));

    // Use Coinbase's facilitator URL or custom one from config
    const facilitatorUrl = config.facilitator || DEFAULT_FACILITATOR_URL;
    console.log("[x402] Facilitator URL:", facilitatorUrl);

    const facilitator = new server.HTTPFacilitatorClient({
      url: facilitatorUrl,
    });

    const result = await facilitator.verify(payload, requirements);

    console.log("[x402] Verification result:", JSON.stringify(result, null, 2));

    if (!result.isValid) {
      console.log("[x402] Payment invalid:", result.invalidReason);
      return {
        valid: false,
        error: result.invalidReason ?? "Payment verification failed",
      };
    }

    console.log(
      "[x402] Payment verified successfully for payer:",
      result.payer
    );

    return {
      valid: true,
      context: {
        payer: result.payer ?? "",
        amount: requirements.maxAmountRequired,
        network: requirements.network,
        asset: requirements.asset,
        toolName,
      },
      payload,
      requirements,
    };
  } catch (error) {
    console.log("[x402] Verification error:", error);
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
  payload: any,
  requirements: ReturnType<typeof createPaymentRequirements>,
  config: X402Config
): Promise<{
  success: boolean;
  transaction?: string;
  network?: string;
  payer?: string;
  errorReason?: string;
}> {
  const server = await getX402Server();

  // Use Coinbase's facilitator URL or custom one from config
  const facilitatorUrl = config.facilitator || DEFAULT_FACILITATOR_URL;

  const facilitator = new server.HTTPFacilitatorClient({
    url: facilitatorUrl,
  });

  return facilitator.settle(payload, requirements);
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
  requirements: ReturnType<typeof createPaymentRequirements>
): string {
  const response = {
    ...settlement,
    requirements,
  };
  return Buffer.from(JSON.stringify(response)).toString("base64");
}
