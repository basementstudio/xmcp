# Changesets

Feature PRs that change core package behavior should include a changeset:

```bash
pnpm changeset
```

This rollout only versions the core packages: `xmcp`, `create-xmcp-app`, and
`init-xmcp`. Plugin packages and `@xmcp-dev/cli` remain on their existing manual
publish workflows.
