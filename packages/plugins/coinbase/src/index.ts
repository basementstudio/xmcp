import { paymentMiddleware } from "@x402/express";
import type { RouteConfig, x402ResourceServer } from "@x402/core/server";
import type { Middleware } from "xmcp";

export interface CoinbasePaymentsOptions {
  server: x402ResourceServer;
  /** A central map of paid tool names to x402 route requirements. */
  tools: Record<string, RouteConfig>;
}

/** Gate named tool calls with x402 HTTP payments; discovery remains free. */
export function coinbasePayments(options: CoinbasePaymentsOptions): Middleware {
  // x402 supports Express 4/5; bridge its installed Express 4 declarations
  // to xmcp's Express 5 declarations at this boundary.
  const handlers = new Map(
    Object.entries(options.tools).map(([name, config]) => [
      name,
      paymentMiddleware(config, options.server) as unknown as Exclude<
        Middleware,
        { router: unknown }
      >,
    ])
  );
  return async (request, response, next) => {
    if (request.method !== "POST") return next();
    const body: unknown = request.body;
    // A payment proof must authorize exactly one operation. Never forward a
    // batch through a single payment gate (including mixed free/paid batches).
    if (Array.isArray(body)) {
      response
        .status(400)
        .json({ error: "Batch requests are not supported by paid endpoints." });
      return;
    }
    if (!body || typeof body !== "object") return next();
    const message = body as {
      method?: unknown;
      params?: { name?: unknown };
      id?: unknown;
    };
    if (
      message.method !== "tools/call" ||
      typeof message.params?.name !== "string"
    )
      return next();
    const handler = handlers.get(message.params.name);
    if (!handler) return next();
    if (typeof message.id !== "string" && typeof message.id !== "number") {
      response
        .status(400)
        .json({ error: "Paid tool calls require a request ID." });
      return;
    }
    await handler(request, response, next);
  };
}
