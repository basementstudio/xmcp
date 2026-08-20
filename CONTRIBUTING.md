# Contributing to xmcp

## Quick Start

**Important: Always branch from `main` and target `main` in your PR.**

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
`init-xmcp`. These three are a `fixed` group, so they always release together on
the same version.

If your PR changes user-facing behavior in one of those packages, add a
changeset and commit the generated file with your PR:

```bash
pnpm changeset
```

Choose `patch`, `minor`, or `major` based on the user-visible impact.

Once your PR lands on `main`, the Changesets workflow opens or updates a Version
Packages PR. That PR applies the pending changesets to the package versions and
changelogs. After it is merged, `publish.yml` builds the core packages and
publishes them to npm with provenance.

To cut a canary in the meantime, run the **Publish Canary Release to NPM**
workflow. It is a Changesets snapshot release: the version is derived from the
pending changesets plus a timestamp — `0.7.0-canary-20260816222921` — and goes
out under the `canary` dist-tag. Nothing is committed back, so canaries never
touch the version history. It needs at least one pending changeset to have
something to release.

Because Changesets versions from the committed `package.json` values, those
versions are the source of truth and must not be edited by hand.

Do not create a separate GitHub Release to publish npm packages. `@xmcp-dev/cli`
is the only package still outside Changesets, listed under `ignore` in
`.changeset/config.json`.

### Releasing a plugin

Plugins are versioned by Changesets too, and each one moves on its own. A
changeset naming only `@xmcp-dev/descope` releases that plugin and nothing else —
it does not touch `xmcp` or the other plugins. Likewise, an `xmcp` patch or minor
does not bump any plugin.

The one case that does fan out is an `xmcp` **major**. Plugins declare
`"xmcp": ">=0.7.0 <1.0.0"` in `peerDependencies`, so 1.0.0 leaves that range and
Changesets majors every plugin — which is correct, since their peer range genuinely
no longer covers the new core. Widen the plugin peer ranges as part of that release.

Do not put `workspace:^` in a plugin's `peerDependencies`. It publishes as a caret,
and a caret on a `0.x` version locks the minor, so every `xmcp` minor would leave
the range and force a major bump of all nine plugins.

Plugins must still depend on `xmcp` with `workspace:*` in `devDependencies`. A
registry range there breaks the release: Changesets rewrites it to the version
being released, and the install that follows cannot resolve it because that
version is not published yet.

### The changeset check

CI fails a PR that edits a releasable package under `packages/` without adding a
changeset, so a change cannot silently miss a release. The website and examples
are private and never trip it. If a change genuinely needs no release — tests,
comments, internal refactors — record that explicitly:

```bash
pnpm changeset add --empty
```

## Reporting Issues

Before jumping into a PR be sure to search existing PRs or issues for an open or closed item that relates to your submission.

Follow the templates to report issues or request features.

If you're adding a new feature, please consider adding an example to the `examples` directory. This will help us test the feature and ensure it works as expected.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
