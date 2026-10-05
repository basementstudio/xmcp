import type { Ratelimit } from "@upstash/ratelimit";
import type {
  McpMiddleware,
  McpMiddlewareContext,
  McpMiddlewareResult,
} from "xmcp";

type Awaitable<T> = T | Promise<T>;
export type RateLimitContext = Extract<
  McpMiddlewareContext,
  { method: "tools/call" }
>;

export interface UpstashRateLimitOptions {
  /** The application owns the Redis connection, algorithm, window and prefix. */
  limiter: Pick<Ratelimit, "limit">;
  /** Return a verified user/customer ID. Missing IDs always deny execution. */
  identifier: (
    context: RateLimitContext
  ) => Awaitable<string | null | undefined>;
  /** Units consumed by each attempt; must be a positive safe integer. Defaults to 1. */
  rate?: number | ((context: RateLimitContext) => Awaitable<number>);
  /** Backend errors and SDK timeouts deny calls unless explicitly set to "open". */
  failureMode?: "closed" | "open";
}

function errorResult(
  text: string,
  metadata?: Record<string, unknown>
): McpMiddlewareResult {
  return {
    isError: true,
    content: [{ type: "text", text }],
    ...(metadata ? { _meta: { "xmcp.dev/rateLimit": metadata } } : {}),
  };
}

/** Apply a shared Upstash budget to tool calls without wrapping tool handlers. */
export function upstashRateLimit(
  options: UpstashRateLimitOptions
): McpMiddleware {
  const { limiter, identifier, rate = 1, failureMode = "closed" } = options;
  if (failureMode !== "closed" && failureMode !== "open") {
    throw new Error('Upstash failureMode must be "closed" or "open".');
  }
  return async (context, next) => {
    // Discovery, prompts and resources do not consume tool-call quotas.
    if (context.method !== "tools/call") return next();
    context.signal.throwIfAborted();
    const key = await identifier(context);
    context.signal.throwIfAborted();
    if (typeof key !== "string" || key.trim().length === 0) {
      return errorResult(
        "A verified customer identifier is required to call this tool."
      );
    }
    const cost = typeof rate === "function" ? await rate(context) : rate;
    context.signal.throwIfAborted();
    if (!Number.isSafeInteger(cost) || cost < 1) {
      throw new Error("Upstash rate must be a positive safe integer.");
    }

    let result: Awaited<ReturnType<Ratelimit["limit"]>>;
    let pendingFailed = false;
    try {
      result = await limiter.limit(key, { rate: cost });
      // Complete SDK analytics/synchronization before returning, including on
      // Workers where work detached from the request may otherwise be dropped.
      pendingFailed = await result.pending.then(
        () => false,
        () => true
      );
    } catch {
      context.signal.throwIfAborted();
      return failureMode === "open"
        ? next()
        : errorResult(
            "Rate limit service unavailable. Please try again later."
          );
    }
    context.signal.throwIfAborted();
    // Never let a background failure override a known denial.
    if (!result.success) {
      const retryAfterSeconds = Math.max(
        0,
        Math.ceil((result.reset - Date.now()) / 1000)
      );
      return errorResult(
        result.reason === "denyList"
          ? "This request is blocked by the rate limit policy."
          : `Rate limit exceeded. Try again in ${retryAfterSeconds} seconds.`,
        {
          reason: result.reason === "denyList" ? "blocked" : "limit",
          limit: result.limit,
          remaining: result.remaining,
          reset: result.reset,
          retryAfterSeconds,
        }
      );
    }
    // Upstash's timeout response can have success=true without a quota decision.
    if (result.reason === "timeout" || pendingFailed) {
      return failureMode === "open"
        ? next()
        : errorResult(
            "Rate limit service unavailable. Please try again later."
          );
    }
    return next();
  };
}
