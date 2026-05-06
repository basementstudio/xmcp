# Contributing to xmcp

## Quick Start

**Important: Always branch from `canary` and target `canary` in your PR.**

Make sure to follow the repository standards.

Keep PRs focused. If you find related cleanup while working, open a follow-up
unless it is required for the current change.

## Get Started

### Repository Setup

We use pnpm and Node 20.x.

To get started, run `nvm use 20` and `pnpm install`.

### Develop xmcp

To run the development server for xmcp, run `pnpm xmcp`. You can test the framework by going into any example directory and running `pnpm dev`.

### Develop create-xmcp-app

Navigate to the package: `cd packages/create-xmcp-app` and run `pnpm dev`.

To test it locally, run `./build-and-link.sh`.

### Develop init-xmcp (adapter mode)

Navigate to the package: `cd packages/init-xmcp` and run `pnpm dev`.

To test it locally, run `./build-and-link.sh`.

### Tests

Run the xmcp test suite with `pnpm test` (full) or `pnpm --filter xmcp test:unit` / `test:integration` for a subset.

Several integration tests use snapshots (`test/integration/__snapshots__/*.snap`) to pin contracts like the public API surface, CLI `--help` output, and build error messages. When a snapshot test fails because of an _intentional_ change — a new public export, a reworded error message, a CLI flag added — regenerate snapshots with `pnpm --filter xmcp test -u` and commit the updated `.snap` files alongside your change.

### End-to-end conformance (mcpjam)

The full client→server lifecycle is exercised by [`@mcpjam/cli`](https://www.npmjs.com/package/@mcpjam/cli) against built fixtures, covering tools, resources, and prompts on both stdio and HTTP. These tests don't run under `pnpm test`; use:

- `pnpm e2e:fast` — fast subset (probe + one tool call), runs on every PR via `ci.yml`.
- `pnpm e2e:full` — full sweep (all surfaces × both transports), gated to canary/main and PRs labeled `full-e2e`.

Local debugging against a fixture without vitest:

```sh
pnpm --filter xmcp build
pnpm --filter @xmcp-fixtures/mcpjam-testbed build
node packages/xmcp/node_modules/@mcpjam/cli/dist/index.js \
  --format json --quiet \
  server doctor \
  --transport stdio --command node \
  --args packages/xmcp/test/fixtures/mcpjam-testbed/dist/stdio.js
```

## Reporting Issues

Before jumping into a PR be sure to search existing PRs or issues for an open or closed item that relates to your submission.

Follow the templates to report issues or request features.

If you're adding a new feature, please consider adding an example to the `examples` directory. This will help us test the feature and ensure it works as expected.

## CI

Default PR CI builds and tests `xmcp` itself. It does **not** rebuild every project under `examples/` — that sweep runs only on push to `canary`/`main`.

If your change touches the compiler, runtime, or anything an example imports, opt the PR into the full sweep by adding the **`full-examples`** label. The `examples-build` matrix will rebuild all 30 committed examples and report each one as a separate check.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
