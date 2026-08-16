# xmcp

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
