import type { Request, Response, NextFunction } from "express";
import { x402Registry } from "./registry.js";
import { getX402Config } from "./middleware.js";
import {
  verifyPayment,
  settlePayment,
  createPaymentRequiredResponse,
} from "./verify.js";
import type { X402Config } from "./types.js";
import { log, logError } from "./logger.js";
import { x402ContextProvider } from "./context.js";

/**
 * Symbol key to store pending settlement on the response object
 */
const PENDING_SETTLEMENT = Symbol("x402PendingSettlement");

interface PendingSettlement {
  payload: unknown;
  requirements: unknown;
  config: X402Config;
}

interface X402Response extends Response {
  [PENDING_SETTLEMENT]?: PendingSettlement | null;
}

function getPendingSettlement(res: X402Response): PendingSettlement | null {
  return res[PENDING_SETTLEMENT] ?? null;
}

function setPendingSettlement(
  res: X402Response,
  data: PendingSettlement | null
): void {
  res[PENDING_SETTLEMENT] = data;
}

function extractToolName(req: Request): string | undefined {
  if (!req.body) return undefined;

  const messages = Array.isArray(req.body) ? req.body : [req.body];

  for (const message of messages) {
    if (message?.method === "tools/call") {
      return message.params?.name;
    }
  }

  return undefined;
}

function extractPaymentFromMeta(req: Request): string | undefined {
  if (!req.body) return undefined;

  const messages = Array.isArray(req.body) ? req.body : [req.body];

  for (const message of messages) {
    if (message?.method === "tools/call") {
      const meta = message.params?._meta;
      if (meta) {
        const payment = meta["x402/payment"] ?? meta["x402.payment"];
        if (payment) return payment;
      }

      const authPayment = message.params?.arguments?.paymentAuthorization;
      if (authPayment) return authPayment;
    }
  }

  return undefined;
}

function extractRequestId(req: Request): string | number | null {
  if (Array.isArray(req.body)) {
    return req.body[0]?.id ?? null;
  }
  return req.body?.id ?? null;
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
  const x402Res = res as X402Response;

  setPendingSettlement(x402Res, null);

  const toolName = extractToolName(req);

  if (!toolName || !x402Registry.has(toolName)) {
    next();
    return;
  }

  const config = getX402Config();
  if (!config) {
    next();
    return;
  }

  const toolOptions = x402Registry.get(toolName)!;

  const paymentFromMeta = extractPaymentFromMeta(req);

  if (!paymentFromMeta) {
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

  setPendingSettlement(x402Res, {
    payload: verification.payload,
    requirements: verification.requirements,
    config,
  });

  // Override res.end to intercept the response and settle payment
  // xmcp uses res.writeHead().end() instead of res.json()
  const originalEnd = res.end.bind(res);
  (res as any).end = function (
    chunk?: any,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void
  ) {
    const pendingSettlement = getPendingSettlement(x402Res);

    if (pendingSettlement && chunk) {
      let body: unknown;
      try {
        const str = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
        body = JSON.parse(str);
      } catch {
        setPendingSettlement(x402Res, null);
        return originalEnd(
          chunk,
          encoding as BufferEncoding,
          callback as () => void
        );
      }

      const isSuccess = !isToolError(body);

      if (isSuccess) {
        settlePayment(
          pendingSettlement.payload,
          pendingSettlement.requirements as any,
          pendingSettlement.config
        )
          .then((settlement) => {
            log("Settlement result:", settlement);
            if (settlement.success && settlement.transaction) {
              const baseUrl =
                settlement.network === "base"
                  ? "https://basescan.org"
                  : "https://sepolia.basescan.org";
              log(`Transaction: ${baseUrl}/tx/${settlement.transaction}`);
            }

            const modifiedBody = addPaymentResponseToMeta(body, settlement);
            setPendingSettlement(x402Res, null);
            return originalEnd(
              JSON.stringify(modifiedBody),
              encoding as BufferEncoding,
              callback as () => void
            );
          })
          .catch((err) => {
            logError("Settlement failed:", err);
            const errorBody = createSettlementErrorResponse(
              body,
              err,
              toolName,
              toolOptions,
              config
            );
            setPendingSettlement(x402Res, null);
            return originalEnd(
              JSON.stringify(errorBody),
              encoding as BufferEncoding,
              callback as () => void
            );
          });

        return res;
      }
    }

    setPendingSettlement(x402Res, null);
    return originalEnd(
      chunk,
      encoding as BufferEncoding,
      callback as () => void
    );
  };

  x402ContextProvider(verification.context!, () => {
    next();
  });
}

/**
 * Check if tool result indicates an error
 */
function isToolError(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;

  if ("error" in body) return true;

  if ("result" in body) {
    const result = (body as any).result;
    if (result && typeof result === "object" && result.isError) return true;
  }

  return false;
}

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
