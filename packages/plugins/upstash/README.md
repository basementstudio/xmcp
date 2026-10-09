# @xmcp-dev/upstash

Apply shared Upstash rate limits to xmcp tool calls with one MCP middleware. Requires xmcp 1.6+ and `@upstash/ratelimit` 2.2+.

```sh
pnpm add @xmcp-dev/upstash @upstash/ratelimit @upstash/redis
```

```ts
// src/middleware.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { upstashRateLimit } from "@xmcp-dev/upstash";

export const mcp = upstashRateLimit({
  limiter: new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.fixedWindow(100, "1 m"),
    prefix: "my-app:tools",
  }),
  // An earlier authenticated MCP middleware must set this request-local value.
  identifier: (context) => context.get<string>("customerId"),
});
```

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. All replicas must use the same Redis database and prefix to share a budget. Supply an identifier from verified authentication on every request; missing identifiers deny execution. Do not use an unverified customer header or an API key as the Redis identifier.

Options:

- `limiter`: an application-owned Upstash `Ratelimit` instance (or an object with its `limit` method).
- `identifier(context)`: required, possibly asynchronous, verified customer ID.
- `rate`: positive safe integer or asynchronous callback; defaults to one unit per attempt.
- `failureMode`: `"closed"` (default) denies on Redis failures, SDK timeouts, or failed background work. `"open"` explicitly allows execution when a quota decision is unavailable. Missing identity and known quota denials always deny.

The middleware only checks `tools/call`. Quota denial returns an MCP tool error (`isError: true`) with `_meta["xmcp.dev/rateLimit"]` containing `reason`, `limit`, `remaining`, `reset` (Unix milliseconds), and `retryAfterSeconds`. It does not produce HTTP 429. The middleware awaits the SDK's `pending` work so serverless runtimes do not discard it. This adds that work's latency to the call.

Each admitted attempt consumes units, including a tool that subsequently fails, is cancelled, or requires another execution round for input. No refunds or billing ledger are provided. Quota algorithms and their consistency guarantees remain those of the supplied Upstash limiter. STDIO works with a server-side identity callback; it has no HTTP headers.

See the [integration guide](https://xmcp.dev/docs/integrations/upstash) and [runnable HTTP example](https://github.com/basementstudio/xmcp/tree/main/examples/upstash-http) for authenticated identities and weighted tool costs.
