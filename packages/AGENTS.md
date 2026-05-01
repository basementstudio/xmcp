# Package guidance - xmcp

Use this file for `packages/**`.

## Core framework

- Keep changes in `packages/xmcp` surgical. Do not rewrite compiler, watcher,
  loader, or runtime foundations when an extension or local fix is enough.
- Register compiler plugins through the existing compiler plugin list. Do not
  attach hooks from unrelated files.
- Keep new config fields optional when the value can be inferred from current
  behavior or structured input.
- Avoid per-tool, per-resource, or per-prompt wrappers for framework features.
  Prefer loader, compiler, or runtime defaults.
- Preserve HTTP and STDIO transport contracts. In particular, do not make a
  stateless HTTP path depend on server-side session state unless the change is
  explicitly about adding stateful transport behavior and includes matching
  docs, examples, and tests.
- Consolidate parallel tool/resource/prompt behavior instead of duplicating
  scattered branches.
- Preserve public exports, `typesVersions`, package metadata, and runtime
  compatibility unless the task is explicitly a breaking change.
- Public API, config, CLI, transport, tool/resource/prompt, auth, plugin, or
  deployment behavior changes must update the relevant docs and add or update a
  runnable example. If no example fits, document why in the PR.

## CLI and scaffolders

- Generated templates should use current xmcp APIs and workspace conventions.
- Template feature changes should be reflected in docs and in at least one
  generated-project example or validation path.
- Keep non-interactive flags working for CI and automation.
- Do not introduce prompts that block scripted usage unless there is an
  explicit `--yes` or equivalent path.
- When template output changes, verify the generated project can build or at
  least type-check using the existing local workflow.

## Plugins

- Keep plugin APIs small and aligned with the core framework style.
- User-facing plugin features need README/docs updates and an example that shows
  the integration path.
- Peer dependency ranges must match how the plugin is actually tested.
- Avoid provider-specific assumptions leaking into shared helpers.
- Include or update the package README when integration setup changes.

## Checks

- Core package: `pnpm --filter xmcp build`.
- Core config behavior: `cd packages/xmcp && pnpm test:config`.
- CLI/scaffolders: `pnpm --filter create-xmcp-app build`,
  `pnpm --filter init-xmcp build`, or the touched package equivalent.
- Plugins: `pnpm --filter <plugin-package> build`.
