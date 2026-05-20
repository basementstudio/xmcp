# Agent guidance - xmcp

This file is the root instruction set for coding agents and contributors. Read
the scoped `AGENTS.md` file for any area you touch:

- `packages/AGENTS.md` for framework, CLI, scaffolder, and plugin packages.
- `examples/AGENTS.md` for examples.
- `apps/website/AGENTS.md` for the docs site and website.

## Repo basics

- Use Node 20 and pnpm.
- Code/package/example changes target `canary`; docs/site-only changes target
  `main`.
- Core package release changes use Changesets. If a PR changes user-facing
  behavior in `xmcp`, `create-xmcp-app`, or `init-xmcp`, add and commit a
  `.changeset/*.md` file with `pnpm changeset`.
- Pushing to `canary` automatically publishes core package canary releases with
  the npm `canary` dist-tag and the `nextPatch-canary.N` version format.
- Changesets runs on `main`: it creates the Version Packages PR, and after that
  PR is merged it publishes stable core packages to npm automatically. Do not
  reintroduce a GitHub Release-based npm publish path.
- Plugin packages and `@xmcp-dev/cli` are not part of the core Changesets
  rollout; keep their existing manual publish workflows unless explicitly asked
  to migrate them.
- Keep PRs focused. If related work appears while editing, leave it for a
  follow-up unless it is required for the current fix.
- User-facing feature or behavior changes need docs and a runnable example. If
  an example is not appropriate, explain why in the PR.
- Prefer existing patterns and helper APIs over new abstractions.
- Do not add dependencies unless the repo already has no reasonable primitive
  for the job.

## Review standards

Apply these before handing work back:

- Use repo formatting and linting, not editor defaults.
- Keep logs minimal. Do not add process narration or debug logs.
- Do not add fixed `setTimeout` or `setInterval` numbers unless the delay is a
  named constant with a clear reason. Prefer signal-based flow.
- Avoid broad rewrites, especially in compiler, loader, runtime, and scaffold
  paths.
- Preserve transport semantics. Do not turn stateless HTTP flows into stateful
  session-based flows, or stateful flows into stateless ones, unless the task
  explicitly requires that transport contract change.
- Stateless HTTP must not depend on server-side memory from previous requests.
  Any client metadata needed by tools after `initialize` must be repeated in the
  current request, not recovered from a hidden session/cache.
- Do not force users to wrap every tool, resource, or prompt for a framework
  feature.
- Keep config fields optional when values can be inferred safely.
- Delete stale examples instead of patching deprecated patterns.
- Explain non-obvious choices in code or PR notes: new hooks, wrappers,
  required fields, timers, plugin registration, and foundational rewrites.

See `REVIEW_RULES.md` for the longer rationale and examples.
