import type { Request, Response, NextFunction } from "express";
import { x402Registry } from "./registry.js";
import { getX402Config } from "./middleware.js";
import {
  verifyPayment,
  settlePayment,
  createPaymentRequiredResponse,
} from "./verify.js";
import type { X402PaymentContext } from "./types.js";

declare global {
  var __XMCP_X402_PAYMENT_CONTEXT: X402PaymentContext | null | undefined;
  var __XMCP_X402_PENDING_SETTLEMENT:
    | {
        payload: unknown;
        requirements: unknown;
        config: unknown;
      }
    | null
    | undefined;
}

// Initialize globals if not set
if (global.__XMCP_X402_PAYMENT_CONTEXT === undefined) {
  global.__XMCP_X402_PAYMENT_CONTEXT = null;
}
if (global.__XMCP_X402_PENDING_SETTLEMENT === undefined) {
  global.__XMCP_X402_PENDING_SETTLEMENT = null;
}

/**
 * Get the current payment context (called from tool handlers)
 */
export function getPaymentContext(): X402PaymentContext | null {
  return global.__XMCP_X402_PAYMENT_CONTEXT ?? null;
}

/**
 * Set the current payment context (called by interceptor)
 */
export function setPaymentContext(context: X402PaymentContext | null): void {
  global.__XMCP_X402_PAYMENT_CONTEXT = context;
}

/**
 * Get pending settlement data
 */
export function getPendingSettlement() {
  return global.__XMCP_X402_PENDING_SETTLEMENT ?? null;
}

/**
 * Set pending settlement data
 */
export function setPendingSettlement(
  data: {
    payload: unknown;
    requirements: unknown;
    config: unknown;
  } | null
): void {
  global.__XMCP_X402_PENDING_SETTLEMENT = data;
}

/**
 * Extract tool name from JSON-RPC request body
 */
function extractToolName(req: Request): string | undefined {
  try {
    if (!req.body) return undefined;

    const messages = Array.isArray(req.body) ? req.body : [req.body];

    for (const message of messages) {
      if (
        message &&
        typeof message === "object" &&
        message.method === "tools/call" &&
        message.params &&
        typeof message.params === "object" &&
        "name" in message.params &&
        typeof message.params.name === "string"
      ) {
        return message.params.name;
      }
    }
  } catch {
    // ignore parsing errors
  }
  return undefined;
}

function extractPaymentFromMeta(req: Request): string | undefined {
  try {
    if (!req.body) return undefined;

    const messages = Array.isArray(req.body) ? req.body : [req.body];

    for (const message of messages) {
      if (
        message &&
        typeof message === "object" &&
        message.method === "tools/call" &&
        message.params &&
        typeof message.params === "object"
      ) {
        console.log(
          "[x402] Message params:",
          JSON.stringify(message.params, null, 2)
        );

        if (
          "_meta" in message.params &&
          message.params._meta &&
          typeof message.params._meta === "object"
        ) {
          // Support both "x402/payment" and "x402.payment" formats
          if ("x402/payment" in message.params._meta) {
            console.log("[x402] Found payment in _meta['x402/payment']");
            return message.params._meta["x402/payment"] as string;
          }
          if ("x402.payment" in message.params._meta) {
            console.log("[x402] Found payment in _meta['x402.payment']");
            return message.params._meta["x402.payment"] as string;
          }
        }

        // Check arguments.paymentAuthorization (withPayment client style)
        if (
          "arguments" in message.params &&
          message.params.arguments &&
          typeof message.params.arguments === "object" &&
          "paymentAuthorization" in message.params.arguments
        ) {
          console.log("[x402] Found payment in arguments.paymentAuthorization");
          return message.params.arguments.paymentAuthorization as string;
        }

        console.log("[x402] No payment found in request");
      }
    }
  } catch (e) {
    console.log("[x402] Error extracting payment:", e);
  }
  return undefined;
}

function extractRequestId(req: Request): string | number | null {
  try {
    if (req.body && typeof req.body === "object") {
      if (Array.isArray(req.body)) {
        return req.body[0]?.id ?? null;
      }
      return req.body.id ?? null;
    }
  } catch {
    // ignore
  }
  return null;
}

function createPaymentRequiredJsonRpcResponse(
  requestId: string | number | null,
  paymentRequired: ReturnType<typeof createPaymentRequiredResponse>
) {
  return {
    jsonrpc: "2.0",
    id: requestId,
    result: {
      isError: true,
      structuredContent: paymentRequired,
      content: [{ type: "text", text: JSON.stringify(paymentRequired) }],
    },
  };
}

export async function x402Interceptor(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  console.log("[x402] Interceptor called");

  // Reset payment context and pending settlement
  setPaymentContext(null);
  setPendingSettlement(null);

  // Extract tool name from request body
  const toolName = extractToolName(req);
  console.log("[x402] Tool name:", toolName);

  // If no tool name or tool is not paid, continue
  if (!toolName || !x402Registry.has(toolName)) {
    next();
    return;
  }

  const config = getX402Config();
  if (!config) {
    // x402 middleware not configured, skip payment check
    next();
    return;
  }

  const toolOptions = x402Registry.get(toolName)!;

  // x402-mcp style: payment comes in _meta["x402/payment"]
  const paymentFromMeta = extractPaymentFromMeta(req);
  console.log(
    "[x402] Payment from meta:",
    paymentFromMeta ? "present" : "missing"
  );

  // No payment - return requirements in structuredContent (HTTP 200)
  if (!paymentFromMeta) {
    console.log("[x402] No payment, returning requirements");
    const paymentRequired = createPaymentRequiredResponse(
      toolName,
      toolOptions,
      config
    );

    res
      .status(200)
      .json(
        createPaymentRequiredJsonRpcResponse(
          extractRequestId(req),
          paymentRequired
        )
      );
    return;
  }

  // Verify payment
  const verification = await verifyPayment(
    paymentFromMeta,
    toolName,
    toolOptions,
    config
  );

  if (!verification.valid) {
    const paymentRequired = createPaymentRequiredResponse(
      toolName,
      toolOptions,
      config,
      verification.error
    );

    res
      .status(200)
      .json(
        createPaymentRequiredJsonRpcResponse(
          extractRequestId(req),
          paymentRequired
        )
      );
    return;
  }

  // Set payment context for tool handler
  setPaymentContext(verification.context!);

  // Store verification data for settlement (will be processed after tool execution)
  setPendingSettlement({
    payload: verification.payload,
    requirements: verification.requirements,
    config,
  });

  // Override res.json to intercept the response and settle payment
  const originalJson = res.json.bind(res);
  res.json = function (body: unknown) {
    const pendingSettlement = getPendingSettlement();

    // Check if response is successful (not an error in result)
    const isSuccess = !isToolError(body);

    if (isSuccess && pendingSettlement) {
      // Settle payment after successful tool execution
      settlePayment(
        pendingSettlement.payload,
        pendingSettlement.requirements as any,
        pendingSettlement.config as any
      )
        .then((settlement) => {
          // Add settlement info to _meta in response
          const modifiedBody = addPaymentResponseToMeta(body, settlement);
          setPendingSettlement(null);
          return originalJson(modifiedBody);
        })
        .catch((err) => {
          console.error("[x402] Settlement failed:", err);
          // Return error if settlement fails
          const errorBody = createSettlementErrorResponse(
            body,
            err,
            toolName,
            toolOptions,
            config
          );
          setPendingSettlement(null);
          return originalJson(errorBody);
        });

      return res;
    }

    setPendingSettlement(null);
    return originalJson(body);
  };

  next();
}

/**
 * Check if tool result indicates an error
 */
function isToolError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;

  // Check JSON-RPC error
  if ("error" in body) return true;

  // Check tool result error (x402-mcp style)
  if ("result" in body) {
    const result = (body as any).result;
    if (result && typeof result === "object" && result.isError) return true;
  }

  return false;
}

/**
 * Add payment response to _meta in JSON-RPC response
 */
function addPaymentResponseToMeta(
  body: unknown,
  settlement: {
    success: boolean;
    transaction?: string;
    network?: string;
    payer?: string;
  }
): unknown {
  if (!body || typeof body !== "object") return body;

  const response = body as any;

  if ("result" in response && response.result) {
    // Ensure _meta exists
    if (!response.result._meta) {
      response.result._meta = {};
    }

    // Add payment response
    response.result._meta["x402/payment-response"] = {
      success: settlement.success,
      transaction: settlement.transaction,
      network: settlement.network,
      payer: settlement.payer,
    };
  }

  return response;
}

/**
 * Create settlement error response
 */
function createSettlementErrorResponse(
  _originalBody: unknown,
  error: unknown,
  toolName: string,
  toolOptions: any,
  config: any
): unknown {
  const paymentRequired = createPaymentRequiredResponse(
    toolName,
    toolOptions,
    config,
    `Settlement failed: ${error}`
  );

  return {
    jsonrpc: "2.0",
    id: null,
    result: {
      isError: true,
      structuredContent: paymentRequired,
      content: [{ type: "text", text: JSON.stringify(paymentRequired) }],
    },
  };
}
