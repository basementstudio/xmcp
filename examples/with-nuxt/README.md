# Nuxt + xmcp

A minimal application with an MCP endpoint at `/mcp` and a `greet` tool.
Requires Node 22.19+ and the repository’s pnpm 10.8.1; xmcp packages use workspace dependencies.

From the repository root:

```sh
pnpm install
pnpm build
cd examples/with-nuxt
pnpm dev
```

Connect an MCP client to `http://localhost:3000/mcp`. List tools and call
`greet` with `{"name":"World"}`; it returns `Hello, World!`.

## Node production

```sh
pnpm build
pnpm start
```

The host build runs after `.xmcp/adapter` is generated. The example includes a
host type check. Use `PORT` to override the production server port.

## Cloudflare Workers

```sh
pnpm build:cf
pnpm preview:cf
```

Use the local URL printed by the preview command, with `/mcp` appended. No live
Cloudflare deployment is required to exercise the Worker locally.
`nodejs_compat` enables request context storage. `pnpm deploy:cf` builds and
publishes through your Cloudflare account.

The example’s scripts select the Cloudflare host configuration and pass `--cf`
to xmcp. Host deployment files are owned by the framework, not xmcp.
Stop dev processes before switching targets: both use `.xmcp/adapter`.

## Development and integration

`pnpm dev` starts the xmcp watcher and host after an initial adapter build. Edit
`src/tools/greet.ts`, then call it again; adding and removing tools updates
discovery. `pnpm dev:cf` uses the Workers adapter runtime with the host development
server. For Nuxt, also validate the built Worker using `pnpm preview:cf`.

The Nuxt config includes `.xmcp` in `nitro.externals.inline` so Nitro bundles
and watches the generated adapter during development.

See the [Nuxt adapter guide](https://xmcp.dev/docs/adapters/nuxt) for custom
routes, authentication handoff, CORS, and stateless request metadata.
