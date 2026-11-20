# Cache hints

Tells MCP clients how long they can reuse listings and resource contents. MCP
revision `2026-07-28` adds `ttlMs` and `cacheScope` to cacheable results; xmcp
sets them from `cacheHints` in `xmcp.config.ts` and from a resource's
`cacheHint` metadata.

| Result                          | `ttlMs`    | `cacheScope` | Set by                     |
| ------------------------------- | ---------- | ------------ | -------------------------- |
| `server/discover`               | `3600000`  | `public`     | `cacheHints` in the config |
| `tools/list`, `resources/list`  | `300000`   | `public`     | `cacheHints` in the config |
| `resources/read docs://pricing` | `86400000` | `public`     | The resource's `cacheHint` |
| `resources/read status://now`   | `0`        | `private`    | Default                    |

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/cache-hints
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## Read the hints

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/list' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"cache-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The result ends with `"ttlMs":300000,"cacheScope":"public"`. Read the two
resources to compare a per-resource hint with the default:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: resources/read' \
  -H 'Mcp-Name: docs://pricing' \
  -d '{"jsonrpc":"2.0","id":2,"method":"resources/read","params":{"uri":"docs://pricing","_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"cache-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

`docs://pricing` returns `"ttlMs":86400000,"cacheScope":"public"`. Change both
URIs to `status://now` and the result has `"ttlMs":0,"cacheScope":"private"`,
because nothing sets a hint for it.

Clients on earlier protocol revisions do not receive cache hints.

## Subscriptions are off

The roster of tools and resources is fixed for the life of a build, so clients
do not need a stream to learn about changes. The config sets
`http.maxSubscriptions: 0` and the server refuses `subscriptions/listen`:

```sh
curl --max-time 10 http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: subscriptions/listen' \
  -d '{"jsonrpc":"2.0","id":3,"method":"subscriptions/listen","params":{"notifications":{"toolsListChanged":true},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"cache-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The response is JSON-RPC error `-32603`, `Subscription limit reached`. Clients
refetch a listing when its `ttlMs` runs out.

## Choosing a scope

`public` means the result is the same for every caller of this server. Keep the
default `private` when an `authorize` policy or other auth-dependent middleware
changes what a caller sees, or when a resource's contents depend on the caller.
