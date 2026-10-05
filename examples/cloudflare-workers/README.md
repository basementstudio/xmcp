# Cloudflare Workers Example

This example demonstrates how to deploy an xmcp MCP server to Cloudflare Workers.

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Build for Cloudflare Workers:

```bash
pnpm build
```

This writes these files into the project root:

- `worker.js` - The bundled Cloudflare Worker
- `wrangler.jsonc` - Wrangler configuration template (only if you don't already have `wrangler.toml/jsonc`)

3. Start development mode (watch + rebuild worker output) and Wrangler:

```bash
pnpm dev
```

This runs `xmcp dev --cf` (rebuilds `worker.js`) and `wrangler dev` together.

4. Test with curl:

```bash
pnpm preview
# or
npx wrangler dev
```

```bash
# Health check
curl http://localhost:8787/health

# List tools
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call a tool
curl -X POST http://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"hello","arguments":{"name":"World"}},"id":2}'
```

5. Deploy to Cloudflare:

```bash
pnpm deploy
# or
npx wrangler deploy
```

## Notes

`src/tools/media-preview.ts` uses `image()` and `embeddedResource()` from
`xmcp/cloudflare` to return binary and text content without Node APIs. Call it
after starting the local preview:

```sh
curl http://localhost:8787/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"media-preview","arguments":{}}}'
```

The response contains a base64 PNG image block and an embedded text resource.
`audio(bytes, mimeType)` is available from the same entry. Use `xmcp/node` file
helpers only in Node applications; Workers should get bytes from bindings or
Web APIs such as `fetch()`.

- The `--cf` flag builds a Cloudflare Workers-native bundle
- All Node.js APIs are bundled into the worker (no external dependencies)
- React component bundles are inlined at compile time
- The worker uses Web APIs only (no Node.js runtime dependencies)
