# HTTP transport

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/http-transport
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`.

## Request context

`src/tools/request-context.ts` reads `getRequestContext()` inside an async helper.
It returns the current client identity, xmcp's HTTP request ID, and a selected
header. The same accessor supplies the live cancellation signal without changing
the tool's arguments.

Call it using an independent HTTP request:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-mcp-client-name: context-example' \
  -H 'x-mcp-client-version: 1.0.0' \
  -H 'x-request-label: demo' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"request-context","arguments":{}}}'
```

Repeat the client identity headers on every legacy HTTP request that needs them.
Removing those headers makes `clientInfo` null in the example's response; each
HTTP request gets its own ID. The runtime does not recover identity from an
earlier request. Modern clients can supply identity in their per-request protocol
metadata.

The accessor is available in tool handlers and their async helpers. Calling it
at module initialization or outside that request scope throws. HTTP details are
absent when a tool runs over STDIO.
