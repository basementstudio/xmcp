# Contributing to xmcp

## Quick Start

**Important: Always branch from `canary` and target `canary` in your PR.**

Make sure to follow the repository standards.

## Get Started

### Repository Setup

We use pnpm and Node version 20.x.

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

## Reporting Issues

Before jumping into a PR be sure to search existing PRs or issues for an open or closed item that relates to your submission.

Follow the templates to report issues or request features.

If you're adding a new feature, please consider adding an example to the `examples` directory. This will help us test the feature and ensure it works as expected.

## CI

Default PR CI builds and tests `xmcp` itself. It does **not** rebuild every project under `examples/` — that sweep runs only on push to `canary`/`main`.

If your change touches the compiler, runtime, or anything an example imports, opt the PR into the full sweep by adding the **`full-examples`** label. The `examples-build` matrix will rebuild all 30 committed examples and report each one as a separate check.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
