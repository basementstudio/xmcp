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

## Reporting Issues

Before jumping into a PR be sure to search existing PRs or issues for an open or closed item that relates to your submission.

Follow the templates to report issues or request features.

If you're adding a new feature, please consider adding an example to the `examples` directory. This will help us test the feature and ensure it works as expected.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
