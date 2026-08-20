# xmcp

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
