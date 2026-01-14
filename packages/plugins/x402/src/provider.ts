import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { Middleware } from "xmcp";
import { extractToolNamesFromRequest } from "xmcp";
import {
  type X402Config,
  type X402ToolContext,
  type PaymentPayload,
  type PaymentRequirements,
  x402ConfigSchema,
} from "./types.js";
import { x402Registry } from "./registry.js";
import {
  verifyPayment,
  settlePayment,
  createPaymentRequiredResponse,
} from "./verify.js";
import { log, logError } from "./logger.js";
import {
  x402ContextProvider,
  toolContextProvider,
  getToolContext,
} from "./context.js";
import { NETWORKS } from "./constants.js";

interface PendingSettlement {
  payload: PaymentPayload;
  requirements: PaymentRequirements;
}

export function x402Provider(config: X402Config): Middleware {
  const parsedConfig = x402ConfigSchema.safeParse(config);

  if (!parsedConfig.success) {
    const errors = parsedConfig.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`x402Provider configuration error:\n${errors}`);
  }

  return x402Middleware(parsedConfig.data);
}

function x402Middleware(config: X402Config): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const paidToolResult = findPaidToolInRequest(req);
    if (paidToolResult.error) {
      sendJsonRpcError(
        res,
        extractRequestId(req),
        -32600,
        paidToolResult.error
      );
      return;
    }

    const toolName = paidToolResult.toolName;
    if (!toolName) {
      next();
      return;
    }

    const toolOptions = x402Registry.get(toolName);

    if (!toolOptions) {
      sendJsonRpcError(
        res,
        extractRequestId(req),
        -32600,
        `Tool ${toolName} not found`
      );
      return;
    }

    const toolCtx: X402ToolContext = {
      toolName,
      toolOptions,
      config,
    };

    toolContextProvider(toolCtx, async () => {
      const paymentHeader = extractPaymentFromMeta(req);
      if (!paymentHeader) {
        sendPaymentRequired(res, req);
        return;
      }

      const verification = await verifyPayment(paymentHeader);

      if (!verification.valid) {
        sendPaymentRequired(
          res,
          req,
          verification.error,
          verification.isV2Format
        );
        return;
      }

      setupSettlementInterceptor(
        res,
        {
          payload: verification.payload!,
          requirements: verification.requirements!,
        },
        verification.isV2Format ?? false
      );

      x402ContextProvider(verification.context!, () => {
        next();
      });
    });
  };
}

function findPaidToolInRequest(req: Request): {
  toolName?: string;
  error?: string;
} {
  const toolNames = extractToolNamesFromRequest(req);
  const paidTools = toolNames.filter((name) => x402Registry.has(name));

  if (paidTools.length > 1) {
    return {
      error: `Batch requests with multiple paid tools are not supported. Found: ${paidTools.join(", ")}. Please make separate requests.`,
    };
  }

  return { toolName: paidTools[0] };
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

// --- Response Helpers ---

function sendJsonRpcError(
  res: Response,
  requestId: string | number | null,
  code: number,
  message: string
): void {
  res.status(400).json({
    jsonrpc: "2.0",
    id: requestId,
    error: { code, message },
  });
}

function sendPaymentRequired(
  res: Response,
  req: Request,
  error?: string,
  isV2Format: boolean = false
): void {
  const paymentRequired = createPaymentRequiredResponse(error, isV2Format);

  res.status(200).json({
    jsonrpc: "2.0",
    id: extractRequestId(req),
    result: {
      isError: true,
      structuredContent: paymentRequired,
      content: [{ type: "text", text: JSON.stringify(paymentRequired) }],
    },
  });
}

function setupSettlementInterceptor(
  res: Response,
  pendingSettlement: PendingSettlement,
  isV2Format: boolean
): void {
  const originalEnd = res.end.bind(res);

  (res as any).end = function (
    chunk?: any,
    encoding?: BufferEncoding | (() => void),
    callback?: () => void
  ) {
    const body = parseResponseBody(chunk);
    if (!body) {
      return originalEnd(
        chunk,
        encoding as BufferEncoding,
        callback as () => void
      );
    }

    if (isToolError(body)) {
      return originalEnd(
        chunk,
        encoding as BufferEncoding,
        callback as () => void
      );
    }

    handleSettlement(pendingSettlement, body)
      .then((finalBody) => {
        return originalEnd(
          JSON.stringify(finalBody),
          encoding as BufferEncoding,
          callback as () => void
        );
      })
      .catch((err) => {
        logError("Settlement failed:", err);
        const errorBody = createSettlementErrorResponse(err, isV2Format);
        return originalEnd(
          JSON.stringify(errorBody),
          encoding as BufferEncoding,
          callback as () => void
        );
      });

    return res;
  };
}

function parseResponseBody(chunk: any): unknown | null {
  if (!chunk) return null;

  try {
    const str = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function handleSettlement(
  pendingSettlement: PendingSettlement,
  body: unknown
): Promise<unknown> {
  const { payload, requirements } = pendingSettlement;
  const { config } = getToolContext();
  const debug = config.debug ?? false;

  const settlement = await settlePayment(payload, requirements);

  log(debug, "Settlement result:", settlement);

  if (settlement.success && settlement.transaction) {
    const networkName =
      settlement.network === "eip155:8453" ? "base" : "base-sepolia";
    const explorer = NETWORKS[networkName].explorer;
    log(debug, `Transaction: ${explorer}/tx/${settlement.transaction}`);
  }

  return addPaymentResponseToMeta(body, settlement);
}

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

    response.result._meta["x402/payment-response"] = {
      success: settlement.success,
      transaction: settlement.transaction,
      network: settlement.network,
      payer: settlement.payer,
    };
  }

  return response;
}

function createSettlementErrorResponse(
  error: unknown,
  isV2Format: boolean = false
): unknown {
  const paymentRequired = createPaymentRequiredResponse(
    `Settlement failed: ${error}`,
    isV2Format
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
