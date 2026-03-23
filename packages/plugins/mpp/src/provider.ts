import crypto from "crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { extractToolNamesFromRequest } from "xmcp";
import { type MppConfig, type MppToolContext, mppConfigSchema } from "./types.js";
import { mppRegistry } from "./registry.js";
import { log, logError } from "./logger.js";
import {
  mppContextProvider,
  toolContextProvider,
  getToolContext,
} from "./context.js";

// Dynamic imports for mppx — resolved at runtime
let mppxInstance: any = null;
let mppxInitPromise: Promise<void> | null = null;

async function initMppx(config: MppConfig): Promise<void> {
  if (mppxInstance) return;
  if (mppxInitPromise) return mppxInitPromise;

  mppxInitPromise = (async () => {
    const { Mppx, stripe } = await import("mppx/server" as string);

    const mppSecretKey =
      config.mppSecretKey ?? crypto.randomBytes(32).toString("base64");

    if (!config.mppSecretKey) {
      console.warn(
        "[mpp] WARNING: No mppSecretKey provided. Using auto-generated ephemeral key. " +
          "Credentials will NOT survive server restarts. " +
          "Set mppSecretKey in your mppProvider config for production use."
      );
    }

    mppxInstance = Mppx.create({
      methods: [
        stripe.charge({
          networkId: "internal",
          paymentMethodTypes: config.paymentMethodTypes ?? ["card", "link"],
          secretKey: config.stripeSecretKey,
        }),
      ],
      secretKey: mppSecretKey,
    });
  })();

  return mppxInitPromise;
}

export function mppProvider(config: MppConfig): RequestHandler {
  const parsedConfig = mppConfigSchema.safeParse(config);

  if (!parsedConfig.success) {
    const errors = parsedConfig.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`mppProvider configuration error:\n${errors}`);
  }

  // Kick off mppx initialization eagerly
  initMppx(parsedConfig.data).catch((err) => {
    logError("Failed to initialize mppx:", err);
  });

  return mppMiddleware(parsedConfig.data);
}

function mppMiddleware(config: MppConfig): RequestHandler {
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

    const toolOptions = mppRegistry.get(toolName);

    if (!toolOptions) {
      sendJsonRpcError(
        res,
        extractRequestId(req),
        -32600,
        `Tool ${toolName} not found`
      );
      return;
    }

    const toolCtx: MppToolContext = {
      toolName,
      toolOptions,
      config,
    };

    toolContextProvider(toolCtx, async () => {
      const debug = config.debug ?? false;

      // Ensure mppx is initialized
      try {
        await initMppx(config);
      } catch (err) {
        logError("mppx initialization failed:", err);
        sendJsonRpcError(
          res,
          extractRequestId(req),
          -32603,
          "Payment service temporarily unavailable. Please retry."
        );
        return;
      }

      if (!mppxInstance) {
        sendJsonRpcError(
          res,
          extractRequestId(req),
          -32603,
          "Payment service failed to initialize."
        );
        return;
      }

      const credential = extractCredentialFromMeta(req);

      // Build a synthetic Fetch API Request for mppx
      const amount = toolOptions.amount ?? config.defaults?.amount ?? "1";
      const currency = toolOptions.currency ?? config.defaults?.currency ?? "usd";
      const decimals = toolOptions.decimals ?? config.defaults?.decimals ?? 2;

      const syntheticUrl = `${req.protocol}://${req.get("host")}${req.originalUrl}`;
      const syntheticHeaders: Record<string, string> = {};

      if (credential) {
        syntheticHeaders["authorization"] = credential;
      }

      const syntheticRequest = new Request(syntheticUrl, {
        method: req.method,
        headers: syntheticHeaders,
        body: req.method !== "GET" && req.body ? JSON.stringify(req.body) : undefined,
      });

      log(debug, `Processing payment for tool: ${toolName}`);
      log(debug, `Amount: ${amount}, Currency: ${currency}`);

      let result: any;
      try {
        result = await mppxInstance.charge({
          amount,
          currency,
          decimals,
          description: toolOptions.description ?? `Access to ${toolName} tool`,
        })(syntheticRequest);
      } catch (err) {
        logError("mppx charge failed:", err);
        sendJsonRpcError(
          res,
          extractRequestId(req),
          -32603,
          "Payment service temporarily unavailable. Please retry."
        );
        return;
      }

      if (!result) {
        sendJsonRpcError(
          res,
          extractRequestId(req),
          -32603,
          "Payment service returned no response."
        );
        return;
      }

      // No credential or invalid credential → return 402 challenge
      if (result.status === 402) {
        log(debug, "Payment required — returning challenge");
        await sendChallenge(res, req, result);
        return;
      }

      // Valid credential — extract receipt and proceed
      log(debug, "Payment verified successfully");

      const paymentContext = {
        paymentId: result.paymentId ?? "",
        amount,
        currency,
        toolName,
        receipt: result.receipt ?? undefined,
      };

      setupReceiptInterceptor(res, paymentContext, result);

      mppContextProvider(paymentContext, () => {
        next();
      });
    });
  };
}

// --- Request Parsing Helpers ---

function findPaidToolInRequest(req: Request): {
  toolName?: string;
  error?: string;
} {
  const toolNames = extractToolNamesFromRequest(req);
  const paidTools = toolNames.filter((name) => mppRegistry.has(name));

  if (paidTools.length > 1) {
    return {
      error: `Batch requests with multiple paid tools are not supported. Found: ${paidTools.join(", ")}. Please make separate requests.`,
    };
  }

  return { toolName: paidTools[0] };
}

function extractCredentialFromMeta(req: Request): string | undefined {
  if (!req.body) return undefined;

  const messages = Array.isArray(req.body) ? req.body : [req.body];

  for (const message of messages) {
    if (message?.method === "tools/call") {
      const meta = message.params?._meta;
      if (meta) {
        const payment = meta["mpp/payment"] ?? meta["mpp.payment"];
        if (payment) return payment;
      }
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

async function sendChallenge(
  res: Response,
  req: Request,
  mppxResult: any
): Promise<void> {
  let challengeBody: unknown;
  let wwwAuthenticate: string | null = null;
  try {
    // mppxResult.challenge is a Response object — extract its body and WWW-Authenticate header
    const challengeResponse = mppxResult.challenge ?? mppxResult;

    // Extract WWW-Authenticate header (contains the full mppx challenge)
    if (challengeResponse && typeof challengeResponse.headers?.get === "function") {
      wwwAuthenticate = challengeResponse.headers.get("www-authenticate");
    }

    if (challengeResponse && typeof challengeResponse.json === "function") {
      challengeBody = await challengeResponse.json();
    } else if (challengeResponse && typeof challengeResponse.text === "function") {
      const text = await challengeResponse.text();
      try {
        challengeBody = JSON.parse(text);
      } catch {
        challengeBody = { raw: text };
      }
    } else {
      challengeBody = challengeResponse;
    }
  } catch {
    challengeBody = { error: "Payment required" };
  }

  const structuredContent = {
    type: "mpp-challenge",
    error: "Payment required",
    challenge: challengeBody,
    ...(wwwAuthenticate ? { wwwAuthenticate } : {}),
  };

  res.status(200).json({
    jsonrpc: "2.0",
    id: extractRequestId(req),
    result: {
      isError: true,
      structuredContent,
      content: [{ type: "text", text: JSON.stringify(structuredContent) }],
    },
  });
}

function setupReceiptInterceptor(
  res: Response,
  paymentContext: {
    paymentId: string;
    amount: string;
    currency: string;
    toolName: string;
  },
  mppxResult: any
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

    // Attach receipt to response, then attempt withReceipt wrapping
    const finalBody = addPaymentResponseToMeta(body, paymentContext);

    return originalEnd(
      JSON.stringify(finalBody),
      encoding as BufferEncoding,
      callback as () => void
    );
  };
}

function parseResponseBody(chunk: any): unknown | null {
  if (!chunk) return null;

  try {
    const str = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
    return JSON.parse(str);
  } catch (err) {
    logError("Failed to parse response body for receipt attachment:", err);
    return null;
  }
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
  paymentContext: {
    paymentId: string;
    amount: string;
    currency: string;
    toolName: string;
  }
): unknown {
  if (!body || typeof body !== "object") return body;

  const response = body as any;

  if ("result" in response && response.result) {
    if (!response.result._meta) {
      response.result._meta = {};
    }

    response.result._meta["mpp/payment-response"] = {
      success: true,
      paymentId: paymentContext.paymentId,
      amount: paymentContext.amount,
      currency: paymentContext.currency,
    };
  }

  return response;
}
