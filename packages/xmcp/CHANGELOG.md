# xmcp

## 1.0.0

### Patch Changes

- 10bdd57: Upgrade to MCP protocol revision 2026-07-28 via the TypeScript SDK v2 (`@modelcontextprotocol/server` and `@modelcontextprotocol/client` replace the v1 `@modelcontextprotocol/sdk` monolith as optional peers, bundled into the runtime).
  - All transports (HTTP, STDIO, Cloudflare Workers, Next.js/Express/Fastify/NestJS adapters) serve both protocol generations: 2026-07-28 envelope requests (including `server/discover`, `resultType`, cacheable list results) natively, and 2025-era clients through the SDK's stateless fallback. HTTP stays strictly stateless — a fresh server per request on both paths.
  - New multi round-trip input API for tools: `inputRequired`, `acceptedContent`, `inputResponse`, and `createRequestStateCodec` are re-exported from `xmcp`, and tool extras expose `inputResponses`/`requestState`. Tools returning `inputRequired(...)` serve both eras (the legacy shim converts to real elicitation for 2025 clients). `extra.elicit()` keeps working on 2025-era connections and throws a descriptive error on 2026-07-28 requests.
  - Tool/prompt/resource schemas are registered through the Standard Schema interface with per-field conversion, keeping the `zod ^3.25.76 || ^4.0.0` peer range working without cross-instance zod composition.
  - Default CORS `allowedHeaders` now include the `Mcp-Method` and `Mcp-Name` headers required on Streamable HTTP POSTs by 2026-07-28.
  - Client helpers (`createHTTPClient`, `createSTDIOClient`) negotiate the protocol version automatically (`server/discover` probe with fallback to `initialize`).
  - Server bundles remain single-file (the SDK's lazy validator imports are inlined by the compiler and the runtime prebuild).
  - Fix: the Express adapter no longer references never-injected CORS globals; it reads the injected `HTTP_CORS_CONFIG` like the other adapters.

## 0.8.0

### Minor Changes

- b7a2b3c: Move the development compiler into `@xmcp-dev/compiler` so production `xmcp` installs contain only the self-contained runtime. Existing `xmcp dev`, `xmcp build`, and `xmcp create` commands remain available through a runtime-package shim, but projects must add `@xmcp-dev/compiler` as a development dependency.

### Patch Changes

- b7a2b3c: Reduce published and generated bundle sizes by loading prebuilt runtime files from disk, avoiding vendored install duplicates, and removing compiler-only schema and terminal dependencies from runtime bundles.

## 0.8.0

### Minor Changes

- Split the development compiler into `@xmcp-dev/compiler`. Existing `xmcp dev`,
  `xmcp build`, and `xmcp create` scripts continue to work through a small shim,
  but projects must install the matching compiler version as a development
  dependency: `npm i -D @xmcp-dev/compiler@0.8.0`.
- Production installs no longer include Rspack or TypeScript. Built HTTP and
  stdio artifacts remain self-contained and can run without `node_modules`.
- Added the `xmcp/config` export so compiler validation uses the config schema
  from the installed runtime package.

### Patch Changes

- Removed the duplicate runtime embedded in the CLI and removed compiler-only
  schema and Chalk code from the HTTP runtime.

## 0.7.1

### Patch Changes

- e3a9f60: Stop shipping `src` in the published package. Every entry point in `main`,
  `types`, `bin`, `exports`, and `typesVersions` resolves into `dist`, and no
  source maps reference `src`, so the directory was dead weight in the tarball:
  223 files down to 71.

## 0.7.0

### Minor Changes

- d5c0f46: Add a Fastify adapter, serve the MCP Server Card at
  `/.well-known/mcp/server-card.json`, fix stateless HTTP handling of repeated
  `clientInfo` headers, and update dependencies to resolve known security
  advisories.
