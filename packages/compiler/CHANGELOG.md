# @xmcp-dev/compiler

## 1.2.0

## 1.1.3

### Patch Changes

- e2c4a5b: Fix Vercel deployments logging `Vercel Runtime Timeout Error: Task timed out after 300 seconds` on every cold start. The build copied `dist/http.js` into the function, and that entry starts a server of its own and exports nothing. Vercel's Node launcher fell back to serving the port the entry listened on, and the listening socket kept the instance's event loop alive: the invocation that booted the server never settled and was killed once the function's maximum duration was reached, even though the response had already been sent in milliseconds. The instance died with it, so the next request cold started and repeated the cycle.

  `--vercel` builds now use a runtime that exports a request handler and never listens, so the platform owns the server and each invocation ends with its response. Standalone (`dist/http.js`), adapter, and Cloudflare builds are unchanged.

## 1.1.2

### Patch Changes

- 64b16a4: Fix the framework adapters producing an export-less bundle in projects whose `package.json` declares `"type": "module"`. In a Next.js 16 app this made the `/mcp` route come up dead: Turbopack reported `The export xmcpHandler was not found in module .xmcp/adapter/index.js. The module has no exports at all.`

  Adapter output is CommonJS because the host framework re-bundles it, but `"type": "module"` put the whole `.xmcp` folder under strict ESM parsing on both sides of that handoff. During the xmcp build it left the prebuilt runtime's `module.exports` assignment dead — stripping every export off the bundle — and gave externalized tool files ESM default interop that the host bundler does not apply, so tools failed to load with `Default export must be a tool handler function`. The host bundler then read the emitted CommonJS `index.js` as ESM as well.

  `.xmcp` is now parsed with CommonJS semantics regardless of the application's module type, and `.xmcp/adapter/package.json` pins the output folder to `"type": "commonjs"`. Output for CommonJS projects, plain server builds, and Cloudflare builds is byte-for-byte unchanged.

## 1.1.1

### Patch Changes

- 01faeb8: Fix `xmcp build --cf` / `xmcp dev --cf` failing with `Module not found: Can't resolve '.../node_modules/xmcp/src/runtime/platforms/cloudflare/worker.ts'` since `src/` stopped shipping in the published package (0.7.1). The Cloudflare worker runtime is now prebuilt into `dist/runtime/cloudflare-worker.js` like the other runtimes, and the compiler uses that artifact as the `--cf` entry instead of bundling xmcp's TypeScript source from `node_modules`.

## 1.1.0

## 1.0.0

### Minor Changes

- dfaf370: Emit ESM server bundles when the application's `package.json` declares `"type": "module"`. The build writes a `dist/package.json` module marker so the self-contained output keeps running when deployed without the project, and node builtins resolve through `createRequire`. Projects without the field keep CommonJS output unchanged.

### Patch Changes

- 10bdd57: Upgrade to MCP protocol revision 2026-07-28 via the TypeScript SDK v2 (`@modelcontextprotocol/server` and `@modelcontextprotocol/client` replace the v1 `@modelcontextprotocol/sdk` monolith as optional peers, bundled into the runtime).
  - All transports (HTTP, STDIO, Cloudflare Workers, Next.js/Express/Fastify/NestJS adapters) serve both protocol generations: 2026-07-28 envelope requests (including `server/discover`, `resultType`, cacheable list results) natively, and 2025-era clients through the SDK's stateless fallback. HTTP stays strictly stateless — a fresh server per request on both paths.
  - New multi round-trip input API for tools: `inputRequired`, `acceptedContent`, `inputResponse`, and `createRequestStateCodec` are re-exported from `xmcp`, and tool extras expose `inputResponses`/`requestState`. Tools returning `inputRequired(...)` serve both eras (the legacy shim converts to real elicitation for 2025 clients). `extra.elicit()` keeps working on 2025-era connections and throws a descriptive error on 2026-07-28 requests.
  - Tool/prompt/resource schemas are registered through the Standard Schema interface with per-field conversion, keeping the `zod ^3.25.76 || ^4.0.0` peer range working without cross-instance zod composition.
  - Default CORS `allowedHeaders` now include the `Mcp-Method` and `Mcp-Name` headers required on Streamable HTTP POSTs by 2026-07-28.
  - Client helpers (`createHTTPClient`, `createSTDIOClient`) negotiate the protocol version automatically (`server/discover` probe with fallback to `initialize`).
  - Server bundles remain single-file (the SDK's lazy validator imports are inlined by the compiler and the runtime prebuild).
  - Fix: the Express adapter no longer references never-injected CORS globals; it reads the injected `HTTP_CORS_CONFIG` like the other adapters.

- af43435: Declare `serverCardHandler` in the generated Next.js adapter types so the documented server-card route passes application type checking.
- Updated dependencies [10bdd57]
  - xmcp@1.0.0

## 0.8.0

### Minor Changes

- b7a2b3c: Move the development compiler into `@xmcp-dev/compiler` so production `xmcp` installs contain only the self-contained runtime. Existing `xmcp dev`, `xmcp build`, and `xmcp create` commands remain available through a runtime-package shim, but projects must add `@xmcp-dev/compiler` as a development dependency.
