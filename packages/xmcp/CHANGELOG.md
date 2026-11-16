# xmcp

## 1.12.1

### Patch Changes

- c683885: Support native ESM named imports from the xmcp root entry so provider plugins load directly in Node.js. Return a nonzero exit status when production compilation fails.

  Generate adapter type declarations before type checking so clean adapter builds can include host imports without disabling type checking.

## 1.12.0

### Minor Changes

- a19cc4e: Add optional `cacheHints` config and a per-resource `cacheHint` metadata field for MCP 2026-07-28 cache hints. Configured listing and read results carry the given `ttlMs` and `cacheScope`; unset methods keep the SDK defaults (`ttlMs: 0`, `cacheScope: "private"`).
- a19cc4e: `createHTTPClient` and `createSTDIOClient` no longer advertise sampling, elicitation, and roots capabilities they cannot serve. They accept an optional `handlers` option, shared with the managed client, and advertise only the capabilities with a configured handler. `ClientHandlers` is now also exported from `xmcp`.
- a19cc4e: Allow any JSON value in a tool's `structuredContent`, as permitted by MCP 2026-07-28. Arrays, strings, numbers, booleans, and `null` are no longer rejected; the MCP SDK wraps non-object values as `{ result }` for clients on earlier protocol revisions.
- a19cc4e: Accept complete Zod schemas for a tool's `schema` and `outputSchema` alongside field maps. Complete output schemas can describe arrays, primitives, and unions, and tools with one can return the data directly as shorthand for `{ structuredContent: data }`. `InferSchema` infers both forms.
- a19cc4e: Read W3C trace context from MCP request `_meta` in execution logs, so `trace.id` and `parent.id` are recorded on STDIO as well as HTTP. `_meta.traceparent` takes precedence over the HTTP `traceparent` header. `getRequestContext()` now exposes a read-only copy of the current request's `_meta`.

## 1.11.0

### Minor Changes

- b5bb292: Add an optional `authorize` export to `src/middleware.ts`. One policy hides denied tools, prompts, resources, resource templates, and skills from listings, rejects direct calls, prompt gets, and reads with the same errors as unknown components, and rejects denied completions like unknown references, on HTTP and STDIO.

  Tool authorization receives raw arguments before SDK validation and shares request-local values with tool middleware and handlers. Skill catalogs authorize their SKILL.md resource before returning entries or pagination.

## 1.10.4

No changes in this release.

## 1.10.3

No changes in this release.

## 1.10.2

### Patch Changes

- 6e13b56: The compiler now runs on Rspack 2, which is ESM-only, so xmcp requires Node.js 22.12 or later. Configs passed to the `bundler` hook receive Rspack 2 options. The Better Auth plugin bundles its sign-in UI, so React and React Router are no longer installed as runtime dependencies.

## 1.10.1

### Patch Changes

- f48c55e: Update dependencies to their latest versions.

## 1.10.0

### Minor Changes

- 3f2eb0e: Serve Agent Skills through the MCP Skills extension (`io.modelcontextprotocol/skills`). Skill directories under `src/skills` (configurable with `paths.skills`) are validated and embedded at build time, published through `skills/list` and `skills/get`, and readable as `skill://` resources.

  `src/skills` is now read by default: every directory there with a `SKILL.md` is served to MCP clients, and other files and directories are skipped with a warning. Set `paths.skills` to `false` if the directory is not for skills.

## 1.9.0

### Minor Changes

- a0f4654: Add optional `http.maxSubscriptions` to limit concurrent subscription streams
  per HTTP handler across standalone HTTP, Vercel, Cloudflare, and all HTTP
  adapters. Set it to `0` to reject `subscriptions/listen` before opening a stream;
  omitting it preserves the SDK default. This does not limit stream duration or
  change ordinary requests, tool-call streaming, or STDIO behavior.

### Patch Changes

- d3d89ce: Refresh the package README with current positioning, a tool example, and the full set of integrations, adapters and deployment targets.

## 1.8.0

### Minor Changes

- 516fc7a: Expose current-request SDK authentication through `RequestContext.authInfo` and MCP middleware, including listing operations, without retaining authentication across requests.
- ad824fe: Expose a read-only registered tool metadata snapshot on `tools/call` MCP middleware as `ctx.tool.metadata`, with normalized `_meta` matching discovery results for shared authorization policies.

### Patch Changes

- 798942d: Update `@modelcontextprotocol/server` to 2.3.0.

## 1.7.2

### Patch Changes

- f42dd7d: Allow static resources to return `inputRequired` results so clients can supply input before reading their contents.

## 1.7.1

### Patch Changes

- 92163c9: Update the bundled MCP client SDK to 2.2.0 and its optional peer requirement. This includes upstream OAuth issuer binding, input-required result metadata preservation, and pagination fixes.

## 1.7.0

### Minor Changes

- 318cc48: Add opt-in `experimental.inferToolSchemas` to generate tool input validation and descriptions from TypeScript types and JSDoc. Resolve imported types and re-exported handlers, refresh schemas during development, and preserve explicit schema overrides. Unsupported inputs fail compilation with actionable diagnostics.

  Support property JSDoc constraints for numeric bounds, string lengths, regular expressions, and email/URI/UUID formats, with source-located errors for invalid tags. Emit compact string enums with actionable validation errors and native boolean schemas.

## 1.6.0

### Minor Changes

- 5948dda: Add Hono and SvelteKit adapters for Node.js and Cloudflare Workers, sharing the stateless Fetch runtime with TanStack Start. Add framework detection, route generation, build ordering, and Workers setup to init-xmcp while preserving host TypeScript configuration.
- 5948dda: Add Nuxt, React Router Framework Mode, and Astro adapters using the shared stateless Fetch runtime, with automatic route setup and Node.js/Cloudflare Workers support.

## 1.5.0

### Minor Changes

- a4950f9: Add optional component include/exclude rules by name or tag in xmcp.config.ts. Apply them before registration across tools, prompts, static resources, and resource templates, with generated UI resources following their owning tool.
- 73deb2e: Add opt-in structured execution logging for tools, prompts, and resource reads through `observability.enabled`, with execution correlation, timing, safe outcomes, and HTTP trace context.
- 4f501f0: Add the Node.js `xmcp/client` entry with `createClient` and `withClient` for managed HTTP and STDIO connections. Register sampling, elicitation, and roots handlers before connecting, advertise only configured capabilities, and await cleanup after failed connections or scoped operations.

## 1.4.1

### Patch Changes

- 5d3fe81: Refresh workspace dependencies to Fastify 5.12.5, js-yaml 4.3.2, and Next.js 16.3.6, including the js-yaml and Next.js overrides. This maintenance release does not change public APIs.

## 1.4.0

### Minor Changes

- 7a3097c: Add optional icons, tags, and enabled metadata for tools, prompts, resources, and resource templates. Expose tags under `_meta["xmcp/tags"]` and omit disabled components and their generated UI resources from registration, listings, and direct requests.

## 1.3.0

### Minor Changes

- c844b6d: Add `image`, `audio`, and `embeddedResource` content helpers, available from `xmcp` and `xmcp/cloudflare`. Add Node-only file-reading variants under `xmcp/node`.
- 1656cdc: Support a named `complete` export on resource template files for URI argument suggestions, including asynchronous and context-dependent completion callbacks. Export `ResourceCompletions` for typed callback maps.
- a1f4d67: Add a TanStack adapter for React applications on Node.js and Cloudflare Workers, with ESM output, stateless request handling, and automatic setup through init-xmcp.

## 1.2.0

### Minor Changes

- 826c21b: Extend MCP middleware to prompts, resource reads, completion, and component listings, sharing request context across each operation. Check `ctx.method` before accessing operation-specific parameters in existing tool middleware.
- 176ac1d: Support a named `mcp` middleware export in `src/middleware.ts` for tool calls across HTTP, STDIO, and Node adapters. Middleware can inspect validated arguments, share request-local values with tools, transform results, or short-circuit execution.
- ae2658a: Allow prompt handlers to return message arrays or full prompt results, preserving message roles, order, descriptions, and metadata. Export the `PromptMessage` and `GetPromptResult` types for typed prompt handlers.
- 0ca4841: Add request-local `set`/`get` values and `progress`/`log` helpers to `getRequestContext()`. Progress is optional without a request token, and logging respects the SDK's capability and level checks.
- b5ca4c8: Add `getRequestContext()` for read-only access to client identity, HTTP request details, and the cancellation signal from tool handlers and their async helpers.

## 1.1.3

### Patch Changes

- e2c4a5b: Fix Vercel deployments logging `Vercel Runtime Timeout Error: Task timed out after 300 seconds` on every cold start. The build copied `dist/http.js` into the function, and that entry starts a server of its own and exports nothing. Vercel's Node launcher fell back to serving the port the entry listened on, and the listening socket kept the instance's event loop alive: the invocation that booted the server never settled and was killed once the function's maximum duration was reached, even though the response had already been sent in milliseconds. The instance died with it, so the next request cold started and repeated the cycle.

  `--vercel` builds now use a runtime that exports a request handler and never listens, so the platform owns the server and each invocation ends with its response. Standalone (`dist/http.js`), adapter, and Cloudflare builds are unchanged.

## 1.1.2

## 1.1.1

### Patch Changes

- 01faeb8: Fix `xmcp build --cf` / `xmcp dev --cf` failing with `Module not found: Can't resolve '.../node_modules/xmcp/src/runtime/platforms/cloudflare/worker.ts'` since `src/` stopped shipping in the published package (0.7.1). The Cloudflare worker runtime is now prebuilt into `dist/runtime/cloudflare-worker.js` like the other runtimes, and the compiler uses that artifact as the `--cf` entry instead of bundling xmcp's TypeScript source from `node_modules`.

## 1.1.0

### Minor Changes

- bbe742e: Add `extra.sample()` so tool handlers can request LLM completions from the connected client via MCP sampling (`sampling/createMessage`), mirroring `extra.elicit()`. Supports text/image/audio messages, `systemPrompt`, `maxTokens`, `modelPreferences`, `temperature`, `stopSequences`, `includeContext`, and `metadata`, and exports the `SampleRequest`/`SampleResult` types. The `tools`/`toolChoice` sampling loop and task-augmented sampling are rejected with a clear error until the client tool-call flow is wired.

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
  but projects need a matching compiler as a development dependency.
  `@xmcp-dev/compiler@0.8.0` is unavailable on npm. Follow the
  [current installation guide](https://xmcp.dev/docs/getting-started/installation)
  to upgrade to a supported runtime/compiler pair.
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
