# create-xmcp-app

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
