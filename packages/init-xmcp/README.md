<div align="center">
  <a href="https://xmcp.dev">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png">
      <img alt="xmcp logo" src="https://assets.basehub.com/bf7c3bb1/303b8a62053c9d86ca3b972b5597ab5c/x.png" height="128">
    </picture>
  </a>
  <h1>xmcp</h1>

<a href="https://basement.studio"><img alt="xmcp logo" src="https://img.shields.io/badge/MADE%20BY%20basement.studio-000000.svg?style=for-the-badge&labelColor=000"></a>
<a href="https://www.npmjs.com/package/init-xmcp"><img alt="NPM version" src="https://img.shields.io/npm/v/xmcp.svg?style=for-the-badge&labelColor=000000"></a>
<a href="https://github.com/basementstudio/xmcp/blob/main/license.md"><img alt="License" src="https://img.shields.io/npm/l/xmcp.svg?style=for-the-badge&labelColor=000000"></a>

</div>

# init-xmcp

Initialize `xmcp` applications with one command on top of Next.js, TanStack, NestJS, Express, and Fastify projects. Unlock the power of `xmcp` discovery and integration with your existing codebase.

## Usage

```bash
npx init-xmcp@latest
```

## Options

- `-v, --version`: Output the current version of init-xmcp.
- `-y, --yes`: Skip confirmation prompts (default: false)
- `--package-manager <manager>`: Specify package manager (npm, yarn, pnpm, bun) (default: "")
- `--tools-path <path>`: Specify custom tools path (default: "")
- `--route-path <path>`: Specify custom route path (default: "")
- `--skip-tools`: Skip tool creation (default: false)
- `--cf`: Build the TanStack adapter for Cloudflare Workers (also inferred from `@cloudflare/vite-plugin`).
- `--skip-route`: Skip route creation (default: false)
- `-h, --help`: Display help message.

## TanStack

React Start projects are detected through `@tanstack/react-start`. Initialization
creates `src/routes/mcp.ts`, discovers handlers in the configured directories, and
builds the adapter before Vite starts. `--route-path src/routes/api` creates an
`/api/mcp` endpoint. Existing route files are preserved; use `--skip-route` to
integrate manually. All options work with `--yes`.

Use `--cf` for Workers builds if the Cloudflare Vite plugin is not installed yet.
Your application owns its hosting setup, including Vite and Wrangler configuration;
Workers require `nodejs_compat`. See the
[TanStack guide](https://xmcp.dev/docs/adapters/tanstack) for Node and Workers
examples, manual setup, authentication, and CORS.

## Getting Started

- Visit [xmcp.dev](https://xmcp.dev) to learn more about the project.
- Visit [xmcp.dev/docs](https://xmcp.dev/docs) to view the full documentation.

## License

This project is licensed under the MIT License - see the [LICENSE](<[LICENSE](https://github.com/basementstudio/xmcp/blob/main/license.md)>) file for details.

## Hono and SvelteKit

`hono` and `@sveltejs/kit` are detected in dependencies or dev dependencies.
Hono setup creates `src/routes/mcp.ts`; mount its default router in your app with
`app.route("/mcp", mcp)`. SvelteKit setup creates `src/routes/mcp/+server.ts`.
Both use relative adapter imports and preserve the host's TypeScript configuration.

`--route-path` selects the directory containing `mcp.ts` (Hono) or `+server.ts`
(SvelteKit). Existing TypeScript or JavaScript route files are preserved and
reported as conflicts. `--skip-route`, other component skip flags, and `--yes`
remain available.

Workers mode is inferred from `@cloudflare/vite-plugin`, Hono's `wrangler`, or
SvelteKit's `@sveltejs/adapter-cloudflare`. `--cf` selects it explicitly. Existing
host and deploy scripts are preserved; xmcp builds run before the host build and
before starting development watchers. Apps without host scripts must provide
their own Hono server command. Hosting configuration remains the app's responsibility.

See the [Hono guide](https://xmcp.dev/docs/adapters/hono) and
[SvelteKit guide](https://xmcp.dev/docs/adapters/sveltekit) for Node and Workers setup.

## Nuxt, React Router, and Astro

Initialization detects `nuxt`, `@react-router/dev` (Framework Mode), and `astro`.
Default routes are `server/routes/mcp.ts`, `app/routes/mcp.ts`, and
`src/pages/mcp.ts`, respectively. React Router users must register the generated
resource route in their existing route configuration. Astro users must have a
server adapter; the generated endpoint disables prerendering.

These adapters use the same Fetch handler and relative imports as Hono and
SvelteKit. They preserve TypeScript configuration and existing host commands.
`--route-path`, `--skip-route`, component skip flags, and `--yes` work for all three.
Nuxt also detects conflicts with method-specific route files.

Workers mode is inferred from `@cloudflare/vite-plugin`, Nuxt's `wrangler`, or
Astro's `@astrojs/cloudflare`; `--cf` overrides detection. Configure the host's
Workers integration and `nodejs_compat` separately. See the
[Nuxt](https://xmcp.dev/docs/adapters/nuxt),
[React Router](https://xmcp.dev/docs/adapters/react-router), and
[Astro](https://xmcp.dev/docs/adapters/astro) guides and runnable examples.

For Nuxt, include `.xmcp` in `nitro.externals.inline` in your existing Nuxt config
so Nitro bundles and watches the generated adapter during development. The CLI
prints this step; see the [Nuxt guide](https://xmcp.dev/docs/adapters/nuxt).
