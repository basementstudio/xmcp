# SvelteKit + xmcp

A minimal SvelteKit application with an MCP endpoint at `/mcp` and a `greet` tool.
Uses local workspace packages. Requires Node 22.17+ and the repository's pnpm 10.8.1.

From the repository root:

```sh
pnpm install
pnpm build
cd examples/with-sveltekit
pnpm dev
```

Connect an MCP client to `http://localhost:5173/mcp`, list tools,
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
pnpm preview:cf
```

Connect the same MCP client to `http://localhost:8787/mcp`. Local Workers
execution needs no deployment credentials. `nodejs_compat` is enabled for request
context storage. `pnpm deploy:cf` publishes the app using your Cloudflare account.

`XMCP_CLOUDFLARE=1` selects the SvelteKit Cloudflare adapter; the scripts set it
automatically. `pnpm dev:cf` uses Vite for editing; `pnpm preview:cf` runs the built
Worker in workerd. Re-run `pnpm build:cf` before previewing changes.

## Development

`pnpm dev` performs an initial adapter build and starts both the xmcp watcher and
host server. Edit `src/tools/greet.ts` and call the tool again to see the change.
Adding or removing tool files updates discovery. Stop both processes when changing
between Node and Workers modes: they share the `.xmcp/adapter` output directory.

Authentication and browser CORS belong in the host application. See the
[SvelteKit adapter documentation](https://xmcp.dev/docs/adapters/sveltekit).
