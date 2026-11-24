# create-xmcp-app

## 1.13.3

No changes in this release.

## 1.13.2

### Patch Changes

- 8469a8e: `create-xmcp-app` now adds `AGENTS.md` and `CLAUDE.md` to new projects, pointing coding agents at the current xmcp docs, the docs MCP server, and the project conventions.

## 1.13.1

### Patch Changes

- 0e0a03e: Scaffold `--cloudflare` projects with `@cloudflare/workers-types` 5 so `npm install` no longer fails with ERESOLVE against current wrangler 4.

## 1.13.0

No changes in this release.

## 1.12.1

No changes in this release.

## 1.12.0

### Minor Changes

- 6bbf233: Telemetry now sends one `dev:started` event per `xmcp dev` session, adds the command, package manager, deploy target, and a fixed list of enabled framework features to build and dev events, and reports config, compile, and client transpile failures in addition to bundler failures. `create-xmcp-app` and `init-xmcp` send one anonymous event when they finish and honour the same opt-out.

## 1.11.0

No changes in this release.

## 1.10.4

No changes in this release.

## 1.10.3

No changes in this release.

## 1.10.2

### Patch Changes

- 6e13b56: The compiler now runs on Rspack 2, which is ESM-only, so xmcp requires Node.js 22.12 or later. Configs passed to the `bundler` hook receive Rspack 2 options. The Better Auth plugin bundles its sign-in UI, so React and React Router are no longer installed as runtime dependencies.

## 1.10.1

### Patch Changes

- f48c55e: Update dependencies to their latest versions.

## 1.10.0

## 1.9.0

## 1.8.0

## 1.7.2

## 1.7.1

## 1.7.0

### Minor Changes

- 004b385: Add the `@xmcp-dev/ui` component library, schema renderer, host bridge hooks,
  schema reference resource, UI showcase, and `--ui-kit` project template. The UI
  integration is opt-in and makes no runtime changes to the core `xmcp` package.

  Configure the UI-kit starter for the shadcn CLI with native package imports,
  a local `cn` helper, and optional Tailwind v4 theme styles. Include a runnable
  shadcn example and light/dark theme compatibility.

## 1.6.0

## 1.5.0

## 1.4.1

## 1.4.0

## 1.3.0

## 1.2.0

## 1.1.3

## 1.1.2

## 1.1.1

## 1.1.0

### Minor Changes

- 86844f7: Require Node.js 22 or newer when creating or initializing xmcp projects, and generate projects with the same minimum Node.js version.

## 1.0.0

## 0.8.0

### Minor Changes

- b7a2b3c: Move the development compiler into `@xmcp-dev/compiler` so production `xmcp` installs contain only the self-contained runtime. Existing `xmcp dev`, `xmcp build`, and `xmcp create` commands remain available through a runtime-package shim, but projects must add `@xmcp-dev/compiler` as a development dependency.

## 0.7.1

## 0.7.0

### Minor Changes

- d5c0f46: Add a Fastify adapter, serve the MCP Server Card at
  `/.well-known/mcp/server-card.json`, fix stateless HTTP handling of repeated
  `clientInfo` headers, and update dependencies to resolve known security
  advisories.
