import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { upstashRateLimit } from "@xmcp-dev/upstash";
import type { McpMiddleware } from "xmcp";

// Configure lazily: building the example does not require live credentials.
let limiter: Ratelimit | undefined;
const sharedLimiter = {
  limit: (...args: Parameters<Ratelimit["limit"]>) => {
    limiter ??= new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.fixedWindow(5, "1 m"),
      prefix: "xmcp:upstash-demo",
      ephemeralCache: false,
    });
    return limiter.limit(...args);
  },
};

export const mcp: McpMiddleware = upstashRateLimit({
  limiter: sharedLimiter,
  identifier: (context) => {
    const authorization = context.http?.headers.authorization;
    if (typeof authorization !== "string") return undefined;
    // Map verified credentials to stable IDs; never store API keys in Redis.
    const customers = [
      [process.env.DEMO_CUSTOMER_A_KEY, "customer-a"],
      [process.env.DEMO_CUSTOMER_B_KEY, "customer-b"],
    ];
    return customers.find(
      ([key]) => key && authorization === `Bearer ${key}`
    )?.[1];
  },
  rate: (context) => (context.params.name === "report" ? 3 : 1),
});
