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

## Releases

Core package releases use Changesets for `xmcp`, `create-xmcp-app`, and
`init-xmcp`.

If your PR changes user-facing behavior in one of those packages, add a
changeset and commit the generated file with your PR:

```bash
pnpm changeset
```

Choose `patch`, `minor`, or `major` based on the user-visible impact. Feature
PRs still target `canary`. Every push to `canary` automatically publishes a
canary release of the core packages with the npm `canary` dist-tag, using the
existing `nextPatch-canary.N` version format.

When changes are promoted to `main`, the Changesets workflow opens or updates a
Version Packages PR. After that PR is merged, Changesets publishes the stable
core packages to npm automatically.

Do not create a separate GitHub Release to publish npm packages. Plugin packages
and `@xmcp-dev/cli` still use their existing manual publish workflows.

## Reporting Issues

Before jumping into a PR be sure to search existing PRs or issues for an open or closed item that relates to your submission.

Follow the templates to report issues or request features.

If you're adding a new feature, please consider adding an example to the `examples` directory. This will help us test the feature and ensure it works as expected.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
