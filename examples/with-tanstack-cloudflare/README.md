# TanStack with xmcp on Cloudflare Workers

A React TanStack app with a stateless MCP endpoint at `/mcp`.
Requires Node 22.12+ and pnpm. From the repository root, run `pnpm install` and
`pnpm build` first to build the local framework and compiler.

```sh
cd examples/with-tanstack-cloudflare
pnpm dev
```

Open `http://localhost:3000`. Connect an MCP client to
`http://localhost:3000/mcp` and call `greet` with `{"name":"World"}`.
Tools in `src/tools` use the usual xmcp exports and are compiled by TanStack.
The initial xmcp build creates the adapter before Vite starts; the xmcp watcher
updates discovery when files are added or removed.

```sh
pnpm build
pnpm preview
```

The Cloudflare Vite plugin runs locally in Workers. nodejs_compat is required. Use Worker-compatible APIs in tools. TanStack owns the worker entry and Wrangler configuration. Run pnpm deploy to deploy.

Authentication and CORS belong in TanStack server-route middleware. Pass verified
MCP authentication as `xmcpHandler(request, { authInfo })`. Stateless calls must
repeat client metadata in each request; initialization does not create a session.
See the [adapter documentation](https://xmcp.dev/docs/adapters/tanstack).
