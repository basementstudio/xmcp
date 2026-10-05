# HTTP and MCP middleware

Run `pnpm install` from the repository root, then run `pnpm build` and `pnpm start`
in this directory. The server listens at `http://localhost:3001/mcp`.

`src/middleware.ts` defines two chains:

- The default export checks the demonstration API key and sets an HTTP response header.
- The named `mcp` export runs around MCP operations. For tool calls, it shares a request-local
  value, stamps the result with `_meta.tool`, and returns an error without running
  `greet` when the supplied name is `blocked`.

```sh
curl -i http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-api-key: 12345' \
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
