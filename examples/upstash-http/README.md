# Upstash shared tool quotas

This HTTP server gives each of two demo customers five units per fixed minute. `greet` costs one unit and `report` costs three. All instances share the same Upstash database and prefix.

Requires Node 22, pnpm, and an Upstash Redis database. From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/upstash
# Link the freshly built CLI on a clean checkout.
pnpm install --frozen-lockfile
cp examples/upstash-http/.env.example examples/upstash-http/.env
```

Fill in the Upstash REST URL/token and two distinct demo API keys in `.env`. Then:

```sh
pnpm --filter upstash-http build
pnpm --filter upstash-http start
```

Connect an MCP client to `http://localhost:3001/mcp` and configure the `Authorization: Bearer <DEMO_CUSTOMER_A_KEY>` header on every request. Call `report` twice in the same minute: the first succeeds, the second returns a tool error with reset information. Customer B has its own budget. Calls that fit the remaining budget can run until it is exhausted; exact boundary behavior follows Upstash's fixed-window algorithm.

Discovery is public in this demo. Tool execution requires a valid key; a missing or invalid key is denied before contacting Redis. The example maps configured keys to stable customer IDs and never uses a credential as a Redis key. In production, integrate your existing authentication provider and derive the customer ID from verified claims. Protect discovery through HTTP authentication too if your application requires it.

The Redis client is initialized lazily, so builds require no credentials. Runtime calls deny access if Redis is unavailable. `failureMode: "open"` is available for applications that explicitly prefer availability over enforcing quotas during outages.

Tests use deterministic limiter responses and a shared external test backend. Testing the example against hosted Upstash requires your own credentials; no database is provisioned by the test suite.
