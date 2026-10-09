# Changesets

Feature PRs that change core package behavior should include a changeset:

```bash
pnpm changeset
```

The core packages (`xmcp`, `@xmcp-dev/compiler`, `create-xmcp-app`, and
`init-xmcp`) version together. UI and plugin packages version independently.
Merge the generated Version Packages PR to publish unpublished versions through
the stable workflow.

`@xmcp-dev/cli` is ignored by stable versioning and has a separate manual publish
workflow. Before Changesets decides whether to version or publish, the stable
workflow removes ignored-only changesets from its disposable checkout. Those
changesets remain in git; they must not prevent publishing already-versioned
packages. Mixed and empty changesets retain the normal Changesets behavior.

Run the release-decision regression checks with:

```bash
node --test scripts/prepare-stable-release.test.cjs
```
