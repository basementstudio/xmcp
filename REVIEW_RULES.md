# xmcp review standards

These standards capture review patterns that have repeatedly mattered in xmcp
PRs. Treat them as the practical checklist before opening or handing back a
change.

## Mechanical standards

1. **Use repo formatting and linting.** Run Prettier, ESLint, builds, and tests
   from this repo rather than editor defaults.
2. **Keep logging minimal.** Logs should surface user-actionable conditions, not
   narrate normal process state.
3. **Avoid magic timers.** Do not add fixed timeout or interval literals unless
   the value is named and justified. Prefer signal-based flow.

## Design standards

4. **Do not rewrite foundations casually.** Compiler, watcher, loader, runtime,
   and scaffolder changes should be targeted. Extend or override before
   replacing core flow.
5. **Register plugins in the right place.** Compiler plugins belong in the
   compiler's explicit plugin list, not in unrelated hook setup.
6. **Keep inferred config optional.** If xmcp can infer a value from structured
   input or existing signals, do not require users to configure it.
7. **Avoid per-item wrappers.** Framework features should not require wrapping
   every tool, resource, or prompt. Prefer framework-level handling.
8. **Preserve transport contracts.** Do not change stateless HTTP behavior into
   stateful session behavior, or the reverse, unless the task is explicitly a
   transport contract change and updates docs, examples, and tests.
9. **Ship user-facing features with docs and examples.** Public API, config,
   CLI, template, transport, auth, plugin, deployment, or tool/resource/prompt
   behavior changes need matching docs and a runnable example. If an example
   does not fit, explain why in the PR.
10. **Consolidate parallel behavior.** Tool, resource, and prompt loaders should
    share shape and error handling where practical.
11. **Remove stale examples.** If an example demonstrates an outdated template or
    deprecated workflow, delete it instead of making it look current.
12. **Keep scope focused.** Do not expand a PR to cover adjacent cleanup unless
    it is necessary for the requested change.

## Final self-check

Before finishing, answer these for the diff:

- Why this fixed number?
- Why this plugin, hook, or wrapper?
- Why rewrite this function instead of extending it?
- Why is this field required?
- Why does this change transport state, session, or connection behavior?
- Where are the docs and runnable example for this user-facing behavior?
- Why add logic here instead of the existing compiler, loader, or package list?

Weak answers mean the change needs another pass.

## Background links

These standards were distilled from review feedback on prior xmcp PRs,
including:

- Formatting and focused follow-up scope:
  https://github.com/basementstudio/xmcp/pull/559
- Compiler, watcher, logging, timers, and plugin registration:
  https://github.com/basementstudio/xmcp/pull/502
- Optional config shape:
  https://github.com/basementstudio/xmcp/pull/498
- Avoiding per-tool wrappers:
  https://github.com/basementstudio/xmcp/pull/503
- Loader consolidation and follow-up scope:
  https://github.com/basementstudio/xmcp/pull/528
- Stale example removal:
  https://github.com/basementstudio/xmcp/pull/493
