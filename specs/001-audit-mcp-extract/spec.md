# Feature Specification: Extract Audit Into `audit-mcp` Package

**Feature Branch**: `xmcp-cli-audit` (existing — no new branch per request)
**Created**: 2026-04-22
**Status**: Draft
**Input**: "Extract the xmcp audit into a new standalone workspace package named `audit-mcp`. Keep everything on the current branch. Package at `packages/audit-mcp/` with its own `package.json`, `bin` entry, library exports, and its own CLI. Consume the 119 files currently under `packages/xmcp/src/cli/commands/audit/` via `git mv` to preserve blame. Sever the only two xmcp couplings (`DEFAULT_PATHS`, `cli-icons`). Build with tsup producing CJS + types. xmcp consumes the package via `workspace:*`. Non-goals: no adapter layer, no new rules, no CLI UX changes, no publishing."

## Clarifications

### Session 2026-04-22

- Q: How should `audit-mcp` classify its `typescript` dependency (used for the AST compiler API)? → A: Runtime `dependencies` — self-contained install for `npx audit-mcp`, no host TS required.
- Q: When `audit-mcp` runs standalone (no xmcp installed), how should it treat a discovered `xmcp.config.ts` in the target project? → A: Load & respect it — same paths/rule-override behavior as `xmcp audit`, preserving FR-015 byte-identical output across invocation modes.
- Q: How should `xmcp audit` / `audit:list-rules` / `audit:explain` / `build --audit` wire to `audit-mcp` after the extraction? → A: In-process library API call — xmcp parses flags and invokes `runAudit` / `runListRules` / `runExplain` / `runScan` directly; no subprocess.
- Q: What Node `engines` constraint should `packages/audit-mcp/package.json` declare? → A: `>=20`.
- Q: Rule ID prefix after extraction — keep `XMCP-*` or rename? → A: Keep `XMCP-*` — preserves baselines, CI filters, and every `--disable-rule` / `--enable-rule` invocation.

## User Scenarios & Testing *(mandatory)*

### Primary User Story

A developer working on an MCP server — xmcp-based or hand-rolled on top of `@modelcontextprotocol/sdk` — wants to audit their project for security, compliance, quality, and performance issues without installing the entire xmcp framework. They run `npx audit-mcp .` in their project directory and get a streaming, colorised report of findings. An xmcp user continues to run `xmcp audit` and sees identical output.

### Acceptance Scenarios

1. **Given** a fresh checkout of the monorepo with the extraction merged, **When** a developer runs `pnpm --filter audit-mcp test`, **Then** all 45 existing audit tests pass and every golden snapshot matches byte-for-byte.

2. **Given** the `audit-mcp` package has been built, **When** a developer runs `node packages/audit-mcp/dist/cli.js examples/audit-findings --ci`, **Then** the output is byte-identical to the same invocation through `xmcp audit` — same 44 findings in the same order with the same exit code.

3. **Given** an xmcp project with existing `xmcp audit` usage in CI, **When** the user upgrades to the extracted version, **Then** `xmcp audit`, `xmcp audit:list-rules`, `xmcp audit:explain`, and `xmcp build --audit` continue working with no flag or output changes.

4. **Given** a non-xmcp Node project (no `xmcp.config.ts`, no `src/tools/`), **When** the user runs `npx audit-mcp .`, **Then** the CLI exits cleanly (exit 0 or 1 depending on findings) and surfaces at least the project-level rules that don't depend on xmcp file routing — hardcoded secrets, supply-chain install scripts, missing package manifest fields, `.env` hygiene.

5. **Given** the xmcp package has been rebuilt after the extraction, **When** a downstream user installs `xmcp`, **Then** `audit-mcp` is installed as a transitive dependency exactly once (not double-bundled into xmcp's `dist/cli.js`) and the xmcp bundle size does not regress by more than the size of a reference to the external dep.

6. **Given** the move preserves history via `git mv`, **When** a developer runs `git log --follow packages/audit-mcp/src/scanner.ts`, **Then** the full history of the original `packages/xmcp/src/cli/commands/audit/scanner.ts` is visible.

### Edge Cases

- What happens when `audit-mcp` is run inside an xmcp project that has `audit-mcp` already installed at a higher version than xmcp's bundled transitive? → Node's resolution picks the hoisted version; output must remain compatible. Covered by stable CLI flag contract and output format.
- What happens when `xmcp build --audit` is run but `audit-mcp` is missing from `node_modules` (broken install)? → Must produce a clear error pointing at the missing dep, not a cryptic import failure.
- What happens to downstream projects pinning the exact audit output? Golden snapshot stability — no reporter-level change — makes this a non-break.
- What happens when two packages in the same monorepo each pull a different version of `audit-mcp`? → Standard pnpm resolution; each gets its own copy. No singleton assumptions.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The project MUST contain a new workspace package rooted at `packages/audit-mcp/` with its own `package.json` declaring `name: "audit-mcp"`, `version: "0.1.0"`, and `license: "MIT"`.
- **FR-002**: The package MUST expose a standalone executable named `audit-mcp` via the `bin` field, runnable as `npx audit-mcp <path>`.
- **FR-003**: The standalone CLI MUST support the exact flag surface currently provided by `xmcp audit`: `--concern`, `--format`, `--severity`, `--fail-on`, `--disable-rule`, `--enable-rule`, `--no-heuristics`, `--no-deps`, `--output`, `--ci`, `--baseline`, `--update-baseline`, `--since`, `--changed`.
- **FR-004**: The standalone CLI MUST also expose the two subcommands `audit-mcp list-rules` and `audit-mcp explain <rule-id>`, mirroring `xmcp audit:list-rules` / `xmcp audit:explain`.
- **FR-005**: The package MUST expose a library API exporting at minimum: `runAudit`, `runListRules`, `runExplain`, `runScan`, `ALL_RULES`, and the TypeScript types `Finding`, `Rule`, `RuleMetadata`, `Severity`, `Concern`, `AuditReport`, `AuditRunOptions`, `ScannerEvent`, `ScannerOptions`.
- **FR-006**: All 119 files currently under `packages/xmcp/src/cli/commands/audit/` MUST be relocated to `packages/audit-mcp/src/` preserving git history (`git mv`, not delete + create).
- **FR-007**: The relocation MUST sever every cross-package import. Specifically, `DEFAULT_PATHS` (currently imported from `packages/xmcp/src/compiler/config/schemas/paths`) and the icon constants (currently from `packages/xmcp/src/utils/cli-icons`) MUST be inlined as new files inside `packages/audit-mcp/src/`.
- **FR-008**: The `xmcp` package MUST continue to provide the `xmcp audit`, `xmcp audit:list-rules`, `xmcp audit:explain` commands and the `xmcp build --audit` preflight hook, each producing output byte-identical to today for the same inputs.
- **FR-009**: `xmcp` MUST consume `audit-mcp` as a dependency via `workspace:*` and route the four commands above through the library API via **in-process function calls** (`runAudit`, `runListRules`, `runExplain`, `runScan`) — NOT by reimplementing the audit inside xmcp and NOT by spawning the `audit-mcp` CLI as a subprocess.
- **FR-010**: xmcp's production bundle MUST NOT statically include the `audit-mcp` implementation. `audit-mcp` MUST be listed in xmcp's bundler externals so the dependency is resolved at runtime from `node_modules`.
- **FR-011**: All 45 audit tests (scanner, baseline, git integration, reporters — including live reporter and progress bar, execution errors, MCP-native rules, config overrides) MUST be relocated to `packages/audit-mcp/src/__tests__/` and pass unchanged. Golden snapshot files (`terminal.golden.txt`, `terminal-clean.golden.txt`, `json.golden.json`, `sarif.golden.json`) MUST move with their tests and match byte-for-byte.
- **FR-012**: The package MUST ship CommonJS build output so existing xmcp consumers (which are CJS) can require it without ESM-interop shims.
- **FR-013**: The package MUST ship TypeScript declaration files (`.d.ts`) for the library API.
- **FR-014**: The package MUST ship a shebang-prefixed `dist/cli.js` so the `bin` entry is directly executable.
- **FR-015**: The extraction MUST NOT introduce behavior changes: the same inputs MUST produce the same findings, in the same order, with the same severities, exit codes, and reporter output, whether invoked through `xmcp audit`, `audit-mcp`, or the library API.
- **FR-016**: Rule IDs MUST retain the existing `XMCP-*` prefix (e.g., `XMCP-SECRET-001`). No rule-ID renaming, aliasing, or namespace shift is introduced by this extraction — baselines, CI filters, and `--disable-rule` / `--enable-rule` invocations stay stable.
- **FR-017**: When `audit-mcp` is invoked standalone against a project containing `xmcp.config.ts`, it MUST load and respect that config (paths, rule-enable/disable overrides) using the same loader currently used by `xmcp audit`, so output remains byte-identical across invocation modes.
- **FR-018**: `packages/audit-mcp/package.json` MUST declare `engines.node: ">=20"`.
- **FR-019**: `typescript` MUST be declared in `packages/audit-mcp/package.json` under `dependencies` (runtime), not `peerDependencies`, so `npx audit-mcp` works on hosts without TypeScript installed.

### Non-Goals

- Adapter layer for non-xmcp MCP frameworks (FastMCP, raw `@modelcontextprotocol/sdk`, etc.). Separate future phase.
- Tagging rules as "universal" vs "xmcp-specific". Separate future phase.
- New rules, rule re-tuning, severity changes, or heuristic logic changes.
- CLI UX changes: no new flags, no rename of existing flags, no reporter visual redesign.
- Publishing to npm. Version stays `0.1.0` and workspace-linked; a publish decision is out of scope.
- Changing which source files are scanned by default (still `src/tools/**`, `src/prompts/**`, `src/resources/**`).

### Key Entities

- **`audit-mcp` package**: New npm package, versioned independently, with its own bin, library exports, and tests.
- **Scanner context** (`ScanContext`): Data structure populated by discovering tools/prompts/resources/config from a project root. Shape unchanged by this feature.
- **Finding**: Unchanged. Every rule emits findings with `{ ruleId, severity, concern, message, file, line?, column?, suggestion?, metadata? }`.
- **Reporter**: Three reporters (terminal batch, terminal live, JSON, SARIF) move verbatim. Interface unchanged.
- **Rule**: 55 rule modules move verbatim. No re-categorization.
- **Golden snapshot**: Reference text used by `reporters.test.ts` to assert byte-exact reporter output. Must stay byte-exact across the move.

## Success Criteria *(mandatory)*

- **SC-001**: `pnpm --filter audit-mcp test` reports 45 passing tests and 0 failures against the moved test suite.
- **SC-002**: Golden snapshots (`terminal.golden.txt`, `terminal-clean.golden.txt`, `json.golden.json`, `sarif.golden.json`) are byte-identical before and after the move (`diff` returns no output).
- **SC-003**: Running the new `audit-mcp` CLI against `examples/audit-findings` with `--no-deps --ci` produces the same report and same exit code as running `xmcp audit` against the same path with the same flags, verified by `diff`-compatible output.
- **SC-004**: Running `xmcp build --audit` against a project with audit findings exits with the same non-zero code it does today and runs no faster / no slower than a 20 % margin.
- **SC-005**: `git log --follow packages/audit-mcp/src/scanner.ts` shows a history starting from the file's original creation date inside `packages/xmcp`, confirming blame preservation.
- **SC-006**: xmcp's production `dist/cli.js` after the extraction is the same size or smaller than before (minus the moved audit code), confirming externalization.
- **SC-007**: A minimal non-xmcp Node project (a single JS file with a hardcoded `sk-…` token and a `.env` without `.gitignore`) invoked via `npx audit-mcp .` produces at least two findings (`XMCP-SECRET-001`, `XMCP-SECRET-002`) — confirming framework-agnostic use is at least partially functional in Phase 1.
- **SC-008**: No test or CI check that ran green before the extraction fails after, excluding tests that have been intentionally relocated.

## Assumptions

- **A1**: The current `xmcp` branch (`xmcp-cli-audit`) and its existing uncommitted changes are compatible with this refactor landing on top. (Confirmed by inventory: the only in-flight changes touch fixture source files and terminal-live formatting; no conflicts with extraction paths.)
- **A2**: `log-update@6` and `chalk@5` ESM packages can be bundled into CJS output by `tsup` (esbuild) — the same interop xmcp currently handles via rspack.
- **A3**: pnpm workspace resolution of `workspace:*` is acceptable for inter-package linkage. At npm publish time (out of scope here) this will resolve to a concrete version.
- **A4**: No external consumer imports anything from `packages/xmcp/src/cli/commands/audit/*` directly. If they do, they'll break; migration guidance is out of scope for this internal refactor.
- **A5**: The 20 rules that don't depend on xmcp file routing (secret detectors, supply-chain install-script checks, package-manifest checks, `.env` hygiene) are sufficient to make `npx audit-mcp` useful on non-xmcp projects even before the adapter phase — providing meaningful value on day one.

## Dependencies

- Bundler: `tsup` (build-time dev dep of the new package).
- Runtime library deps (transferred from xmcp, all in `dependencies`): `chalk`, `ci-info`, `commander`, `glob`, `log-update`, `typescript` (AST compiler API — runtime dep, not peer).
- Runtime environment: Node `>=20` (declared via `engines.node`).
- Workspace tooling: existing pnpm workspace configuration supports adding a new package under `packages/`.
- Git history: mandatory `git mv` workflow to preserve blame through the move.

## Out of Scope

- MCP framework adapters (xmcp, SDK-raw, FastMCP, etc.).
- Rule re-tagging as adapter-gated.
- Publishing to the npm registry.
- Documentation site updates beyond a README in the new package.
- CI configuration updates beyond swapping the audit test filter (`pnpm --filter xmcp test:audit` → `pnpm --filter audit-mcp test`).
