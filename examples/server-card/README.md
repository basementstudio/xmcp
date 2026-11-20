# Server card

xmcp's HTTP server publishes an MCP Server Card at
`/.well-known/mcp/server-card.json`. Discovery tools fetch it to learn what the
server is and where its MCP endpoint lives, without connecting first. The card
is built from `template` in `xmcp.config.ts` and the `version` in
`package.json`.

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/server-card
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## Fetch the card

```sh
curl http://localhost:3001/.well-known/mcp/server-card.json
```

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
  "name": "localhost/mcp",
  "version": "1.0.0",
  "description": "Search the bookshop catalog and check stock.",
  "title": "Bookshop",
  "remotes": [{ "type": "streamable-http", "url": "http://localhost:3001/mcp" }]
}
```

The response is served as `application/mcp-server-card+json`, can be cached for
an hour, and allows any origin to read it.

## Name and URL follow the request

`name` is the request's hostname in reverse-DNS form, and `remotes[0].url` uses
the request's host and protocol. Behind a proxy that sets `x-forwarded-proto`,
the card points at the public address:

```sh
curl http://localhost:3001/.well-known/mcp/server-card.json \
  -H 'Host: books.example.com' \
  -H 'x-forwarded-proto: https'
```

This returns `"name":"com.example.books/mcp"` and
`"url":"https://books.example.com/mcp"`.

## The same identity over MCP

`template.name`, `description` and `icons` are also the server identity that MCP
clients receive. `src/assets/icon.svg` is read at build time and inlined as a
data URI:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"card-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

The result's `_meta["io.modelcontextprotocol/serverInfo"]` has the name
`Bookshop`, the description and the icon.
