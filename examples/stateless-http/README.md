# Stateless HTTP

A cart that survives across tool calls without a session. MCP revision
`2026-07-28` removed protocol-level sessions: state that spans calls travels in
a handle the server mints and the client passes back as an ordinary tool
argument. Here the handle is the cart itself, signed so it cannot be edited.

From the repository root, install dependencies with `pnpm install`, then build the
local framework and compiler with `pnpm build`.

```sh
cd examples/stateless-http
pnpm build
pnpm start
```

The server listens at `http://localhost:3001/mcp`. If that port is taken, xmcp
uses the next free one and prints it.

## Discover the server

A `2026-07-28` client sends its protocol version, identity and capabilities with
every request. There is no `initialize` handshake to run first:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: server/discover' \
  -d '{"jsonrpc":"2.0","id":1,"method":"server/discover","params":{"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"stateless-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

## Carry state in a handle

`create-cart` returns a handle under `structuredContent.cart`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/call' \
  -H 'Mcp-Name: create-cart' \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"create-cart","arguments":{},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"stateless-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

Pass it to `add-item`, which returns a new handle that replaces it. Put the
handle you received in place of `<cart>`:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2026-07-28' \
  -H 'Mcp-Method: tools/call' \
  -H 'Mcp-Name: add-item' \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add-item","arguments":{"cart":"<cart>","sku":"tee-black","quantity":2},"_meta":{"io.modelcontextprotocol/protocolVersion":"2026-07-28","io.modelcontextprotocol/clientInfo":{"name":"stateless-example","version":"1.0.0"},"io.modelcontextprotocol/clientCapabilities":{}}}}'
```

`view-cart` takes the latest handle and returns the items and
`"totalInCents": 5000`. A handle that was edited or minted by another server is
rejected with the tool error `Cart handle was not issued by this server`.

`src/lib/cart-handle.ts` signs handles with `CART_HANDLE_SECRET`. Without it the
server signs with a random key created at startup, so handles stop working when
the process restarts and are not accepted by other instances. Set the variable
to the same value on every instance in production:

```sh
CART_HANDLE_SECRET=replace-with-a-long-random-value pnpm start
```

A handle that holds the state suits small values. For larger state, store it in
a database and mint a handle that holds only its key.

## Client identity on each request

`describe-caller` reads `getRequestContext().clientInfo`. With the `_meta`
envelope above it returns `{"name":"stateless-example","version":"1.0.0"}`.
Nothing is remembered between requests, so a request that omits its identity
gets `null`.

Clients on protocol `2025-11-25` are served by the same stateless server and can
repeat their identity in headers:

```sh
curl http://localhost:3001/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-11-25' \
  -H 'x-mcp-client-name: legacy-client' \
  -H 'x-mcp-client-version: 0.9.0' \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"describe-caller","arguments":{}}}'
```

No response carries an `Mcp-Session-Id` header on either protocol generation.
