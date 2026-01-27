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

This creates a `.cloudflare/` directory with:
- `worker.js` - The bundled Cloudflare Worker
- `wrangler.toml` - Wrangler configuration template

3. Test locally with Wrangler:
```bash
pnpm preview
# or
cd .cloudflare && npx wrangler dev
```

4. Test with curl:
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
cd .cloudflare && npx wrangler deploy
```

## Notes

- The `--cf` flag automatically sets `experimental.adapter = "cloudflare"` in your config
- All Node.js APIs are bundled into the worker (no external dependencies)
- React component bundles are inlined at compile time
- The worker uses Web APIs only (no Node.js runtime dependencies)
