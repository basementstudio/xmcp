# Hono + xmcp

A minimal Hono application with an MCP endpoint at `/mcp` and a `greet` tool.
Uses local workspace packages. Requires Node 22.12+ and the repository's pnpm 10.8.1.

From the repository root:

```sh
pnpm install
pnpm build
cd examples/with-hono
pnpm dev
```

Connect an MCP client to `http://localhost:3000/mcp`, list tools,
and call `greet` with `{"name":"World"}`. It returns `Hello, World!`.
The root URL also serves a small application response.

## Node production

```sh
pnpm build
pnpm start
```

The Node server listens on port 3000; use `PORT` to override it.
The build generates `.xmcp/adapter` before building the host application.

## Cloudflare Workers

```sh
pnpm build:cf
pnpm dev:cf
```

Connect the same MCP client to `http://localhost:8787/mcp`. Local Workers
execution needs no deployment credentials. `nodejs_compat` is enabled for request
context storage. `pnpm deploy:cf` publishes the app using your Cloudflare account.

Hono uses `src/index.ts` as its Worker entry and `src/server.ts` for Node.

## Development

`pnpm dev` performs an initial adapter build and starts both the xmcp watcher and
host server. Edit `src/tools/greet.ts` and call the tool again to see the change.
Adding or removing tool files updates discovery. Stop both processes when changing
between Node and Workers modes: they share the `.xmcp/adapter` output directory.

Authentication and browser CORS belong in the host application. See the
[Hono adapter documentation](https://xmcp.dev/docs/adapters/hono).
