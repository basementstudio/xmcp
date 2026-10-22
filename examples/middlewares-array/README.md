# HTTP and MCP middleware

Run `pnpm install` from the repository root, then run `pnpm build` and `pnpm start`
in this directory. The server listens at `http://localhost:3001/mcp`.

`src/middleware.ts` defines two chains:

- The default export checks the demonstration API key, supplies verified `req.auth`, and sets an HTTP response header.
- The named `mcp` export runs around MCP operations. For tool calls, it shares a request-local
  value, stamps the result with `_meta.tool`, and returns an error without running
  `greet` when the supplied name is `blocked`.

```sh
curl -i http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-reader' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Ada"}}}'
```

The response contains `Hello, Ada!`, `_meta: { "tool": "greet" }`, and the
`x-example: middlewares-array` header. Change `Ada` to `blocked` to exercise the
short-circuit response. Omit the API key to exercise HTTP authentication.

The resource middleware hides `demo://private` from `resources/list` and rejects
`resources/read` for that URI, including direct requests from clients that already
know it. `demo://public` remains readable. Try the same curl command with:

```json
{ "jsonrpc": "2.0", "id": 2, "method": "resources/list", "params": {} }
```

The listing includes `demo://public` and the existing app config; `demo://private`
is absent. To verify direct denial, use:

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": { "uri": "demo://private" }
}
```

MCP middleware also runs on STDIO and the Node adapters. It covers tool calls,
prompts, resource reads, completion, and all four catalog listings. The default HTTP
export follows the transport's existing middleware behavior and is not executed
on STDIO. Keep shared module initialization free of HTTP-only side effects.

## Per-caller tool access

The public demo keys are `demo-reader` (scope `greet`) and `demo-limited` (no
scopes). They are examples, not production credentials. MCP middleware reads
`ctx.authInfo` and the tool's registered `_meta["demo/requires"]` policy to
hide `greet` from callers without its scope and deny direct calls before the
handler runs. The same `canCall` function checks `ctx.tool.metadata._meta` for
calls and each tool's `_meta` in listing results; no separate name-to-policy map
is needed. Verify both paths:

```sh
curl -s http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-limited' \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/list","params":{}}'

curl -s http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: demo-limited' \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"greet","arguments":{"name":"Ada"}}}'
```

The restricted listing has no `greet`; the direct call returns `isError: true`
with `Forbidden`. Change the key to `demo-reader` to list and call `greet`.
Change it to `invalid` to get HTTP 401. Every request supplies its own key.
On STDIO no HTTP authentication runs, so this example denies the protected tool.

The built-in API-key helper validates keys without populating `req.auth`, and
JWT middleware sets `req.user`. This demo explicitly supplies SDK authentication
after verification; production integrations must do the same or supply Fetch
adapter `authInfo` options. Never send authentication tokens back in tool results.
