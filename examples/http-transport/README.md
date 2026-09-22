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

## Request-local values and progress

`src/tools/request-progress.ts` normalizes a list of strings. Its helper reads and
updates the completed count with `context.get()` and `context.set()`, then sends
progress with `context.progress()`. Every tool invocation starts with empty local
values, including concurrent calls and later retries.

Supply a progress token to receive progress notifications in the HTTP response:

```sh
curl -N http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"request-progress","arguments":{"items":[" first ","second"]},"_meta":{"progressToken":"normalize-demo"}}}'
```

The response includes progress values `0`, `1`, and `2` with a total of `2`,
followed by the normalized result. Omitting `_meta.progressToken` still runs the
tool successfully and sends no progress notifications. SDK clients can opt in
with their `callTool` request option `onprogress`.

The tool also calls `context.log()`, which follows the SDK's logging capability
and level checks. xmcp's default server does not enable MCP logging, so this call
is a no-op in the example; it does not write to stdout or stderr.
