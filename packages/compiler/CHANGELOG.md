# @xmcp-dev/compiler

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
