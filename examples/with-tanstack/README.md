# TanStack Start with xmcp

A React TanStack Start app with a stateless MCP endpoint at `/mcp`.
Requires Node 22.12+ and pnpm. From the repository root, run `pnpm install` and
`pnpm build` first to build the local framework and compiler.

```sh
cd examples/with-tanstack
pnpm dev
```

Open `http://localhost:3000`. Connect an MCP client to
`http://localhost:3000/mcp` and call `greet` with `{"name":"World"}`.
Tools in `src/tools` use the usual xmcp exports and are compiled by TanStack.
The initial xmcp build creates the adapter before Vite starts; the xmcp watcher
updates discovery when files are added or removed.

```sh
pnpm build
pnpm start
```

Production uses Nitro's Node output. Application imports are compiled by TanStack/Vite.

Authentication and CORS belong in TanStack server-route middleware. Pass verified
MCP authentication as `xmcpHandler(request, { authInfo })`. Stateless calls must
repeat client metadata in each request; initialization does not create a session.
See the [adapter documentation](https://xmcp.dev/docs/adapters/tanstack).
