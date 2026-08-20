# xmcp testsuite — roadmap

Track of what was shipped in the foundation PR and what to land next, organised so each follow-up is a focused PR (review rule #10). A new chat should be able to pick up any phase from cold.

---

## Quick context for a fresh chat

- **Test runner:** vitest 4.1.5 (configured at `packages/xmcp/vitest.config.ts`, root config at `vitest.config.ts`).
- **Layout:** `packages/xmcp/test/{unit,integration,fixtures}/`. Tests live outside `src/` because the npm tarball uses `"files": ["dist", "src"]` — see `packages/xmcp/package.json:79-82`. CI job `pack-check` enforces it.
- **Path alias:** `@/*` → `src/*` (configured in vitest.config.ts).
- **Helpers:** `test/integration/_utils.ts` exposes `buildFixture`, `spawnHttpServer`, `spawnStdioClient`, `spawnDevServer`, `postJsonRpc`, `findFreePort`, `snapshotFileTree`, plus the `mcpjam*` family (`mcpjamDoctor`, `mcpjamToolsList`, `mcpjamToolsCall`, `mcpjamResourcesList`, `mcpjamResourceRead`, `mcpjamPromptsList`, `mcpjamPromptGet`, `mcpjamStdioTarget`). Use them — don't roll your own spawn/fetch.
- **Fixtures:** `test/fixtures/{basic-tools,empty-paths,custom-paths,mcpjam-testbed,vercel-output,cloudflare-output,adapter-express,adapter-nestjs,adapter-nextjs}/`. Each is a workspace package (added to `pnpm-workspace.yaml`). Add new fixtures the same way.
- **Reporters:** `process.env.CI` switches the reporter. Local = verbose, CI = default, GitHub Actions = default + `github-actions`.
- **CI:** `.github/workflows/ci.yml` runs `lint-and-typecheck`, `test` (matrix: ubuntu+macos × Node 20+22), `pack-check`, `package-integrity`, `coverage` on every PR. Slow CLI/example smoke + per-example build sweep is in `.github/workflows/examples.yml` (push to canary/main, manual dispatch, or `full-examples` PR label).
- **Review rules:** `.claude/review-rules.md` — read before any edit. Stop hook auto-checks formatting + magic timers.

How to run from any directory:
```bash
pnpm test            # all tests, verbose locally
pnpm test:ui         # browser UI
pnpm test:watch      # interactive watch
pnpm test:ci         # forces compact CI-style output
pnpm typecheck
```

---

## Phase 1 — Foundation [DONE]

The current branch ships:

- Vitest workspace setup (root + xmcp package).
- 7 existing `node:test` tests moved from `src/**/__tests__/` to `test/unit/<mirror>/` and ported to vitest.
- New unit coverage for tool/resource/prompt loaders (regression for PR #528).
- HTTP stateless contract test — Layer A (AST checks via TypeScript compiler API) + Layer B (live server behaviour). Catches the PR #559 / `a69f7d6` regression.
- stdio transport test (initialize → tools/list → tools/call) over a typed JSON-RPC client.
- Compiler integration tests against three fixtures (`basic-tools`, `empty-paths`, `custom-paths`).
- CI restructured: `lint-and-typecheck`, `test (Node 20.x + 22.x)`, `pack-check`, `package-integrity`.
- `pack-check` job ensures no test/fixture files leak into the npm tarball.
- `examples.yml` workflow for slow CLI/example smoke (post-merge only).

**Total at foundation:** 174 tests, ~8s end-to-end, 13 test files.

**Suite as of Phase 11:** 230 passing / 2 skipped (PERF=1-gated), ~14s end-to-end, 23 test files.

---

## Phase 2 — Hygiene cleanup [DONE]

Carry-overs surfaced during the foundation review. Shipped: 2.1 (magic timeouts extracted) and 2.2 (canary TODO recorded inline). 2.3 (lint reactivation) deferred to a structural PR — see below.

### 2.1 Rule 3 — extract magic timeouts [DONE]

`packages/xmcp/test/integration/_utils.ts` had four raw `setTimeout(..., N)` literals. Hoisted to three named constants at the top of the file with WHY comments:

```ts
const SIGTERM_GRACE_MS = 5_000;            // SIGTERM → SIGKILL grace
const SERVER_STARTUP_TIMEOUT_MS = 20_000;  // http startup-line ceiling
const STDIO_REQUEST_TIMEOUT_MS = 10_000;   // stdio JSON-RPC reply ceiling
```

The two embedded error strings ("within 20s", "after 10s") were also templated off the constants so they can't drift. Stop hook (`bash .claude/hooks/valerules-check.sh`) exits 0 on the diff. Suite still 174/174 green.

### 2.2 path-utils empty-segment behaviour [CANARY TODO]

`test/unit/compiler/utils/path-utils.test.ts:126` asserts `tools__calculator` (double underscore) for `"tools//calculator.tsx"`. The behaviour comes from `src/runtime/utils/path-to-tool-name.ts` — `normalizeAndGetBaseName` runs `path.replace(/\\/g, "/")` then `withoutExtension.replace(/\//g, "_")` without first deduping consecutive `/`. Each empty segment becomes its own `_`.

**How it can actually surface (not just a synthetic test input):**

1. **Windows paths.** `tools\\calculator.tsx` (escaped backslash from JSON, env vars, or string concat) normalizes to `tools//calculator.tsx` → `tools__calculator_<hash>`.
2. **Trailing-slash config.** A `paths: { tools: "src/tools/" }` entry concatenated with a slash-prefixed glob result yields `src/tools//calculator.tsx`.
3. **Manual string concat over `path.join`.** Any caller that builds paths with `+` instead of `node:path`.

Two real call sites are exposed: `compiler/index.ts:427` (`reactToolPath`) and `runtime/utils/resources.ts:107` (`autoResource.toolPath`).

**Fix on canary** (out of scope for this Phase 2 PR — left as a TODO for the maintainer):

- Decide: collapse consecutive separators, or keep current behaviour as a stable hash input?
- If collapsing: dedupe `/+` to `/` in `normalizeAndGetBaseName` *before* the underscore replace. Update the test at `path-utils.test.ts:126` to assert the new single-underscore output. Note this changes generated tool names for any user currently hitting the edge case — call it out in the changelog.
- If keeping: rename the test (e.g. "consecutive separators are preserved as consecutive underscores — stable, intentional") and add a `// stable: don't normalize` comment in `path-to-tool-name.ts`.

A `TODO(canary)` marker has been added at `test/unit/compiler/utils/path-utils.test.ts:126` pointing back here so the next person touching the test sees it.

### 2.3 Lint reactivation (optional) [DEFERRED]

`packages/xmcp/.eslintrc.js` uses legacy format; `packages/eslint-config-custom/eslint.config.js` uses flat config. They don't bridge cleanly — `pnpm exec eslint` fails at the package level today. The CI lint job currently runs `pnpm turbo lint --filter=xmcp` but xmcp has no `lint` script, so it's a no-op.

**Status:** deferred to its own structural PR — out of scope for the Phase 2 hygiene cleanup. Two paths when it lands: consolidate on flat config, or drop the CI lint job until consolidated.

---

## Phase 3 — Unit coverage gaps [DONE]

High-leverage source-level coverage for code that's churned. Pure unit, no fixtures.

Shipped: 36 new tests across 5 files. Suite now 210/210, ~8s.

- `test/unit/auth/jwt.test.ts` — 8 cases (valid round-trip, expired, malformed, wrong-secret, issuer mismatch, missing/non-Bearer/empty header).
- `test/unit/auth/api-key.test.ts` — 9 cases (static match/miss, missing header, custom `headerName`, default-header isolation, custom validator pass/fail, mutually-exclusive and missing-config throws).
- `test/unit/runtime/headers.test.ts` — 7 cases. The missing-context throw test is kept first in the file: `httpRequestContextProvider` sets a globalThis fallback that persists once any provider has run, so the throw case has to execute before any `withHeaders()` call.
- `test/unit/compiler/config/zod-cross-version.test.ts` — 5 cases pinning that `zod/v3` and `zod/v4` are both resolvable, identical user-tool shapes parse under both, and v4 raw-shape entries expose `.parse` (the surface `transformers/tool.ts` walks).
- `test/unit/compiler/config/cors-defaults.test.ts` — 7 cases pinning PR #552: `mcp-session-id` + `mcp-protocol-version` always present in default `allowedHeaders`/`exposedHeaders`, augmented (deduped) on user arrays, string-form left untouched.

Note: `makeReq`/`makeRes` are duplicated inline across the two auth test files (~30 lines each). Only two consumers today and Phase 3 brief said "pure unit, no fixtures" — easy to lift to `test/unit/auth/_helpers.ts` when the next auth test lands.

### 3.1 Auth middleware

- `test/unit/auth/jwt.test.ts` — `src/auth/jwt.ts`. Cases: valid token round-trip, expired token rejected, malformed token rejected, missing-signing-key rejection, secret rotation behaviour if any.
- `test/unit/auth/api-key.test.ts` — `src/auth/api-key.ts`. Cases: valid key passes, missing header rejected, wrong key rejected, key list rotation, header name configurability.

### 3.2 Headers utility

- `test/unit/runtime/headers.test.ts` — `src/runtime/headers.ts`. Test the helper functions for header injection / extraction shape, the request-context awareness, and any HTTP/stdio asymmetry.

### 3.3 Zod cross-version compat

- `test/unit/compiler/config/zod-cross-version.test.ts` — `src/compiler/config/index.ts` (and `generate-tools-code.ts`). Verify a representative tool schema parses cleanly under both Zod v3 and Zod v4 — pin the cross-version invariants the tooling has churned on.
- May require importing zod via two different paths (`zod`/`zod/v4` or similar). Inspect `src/runtime/utils/zod*` for the existing dual-version helpers.

### 3.4 CORS header defaults

- `test/unit/compiler/config/cors-defaults.test.ts` — `src/compiler/config/schemas/transport/http.ts`. Pin that `mcp-session-id` and `mcp-protocol-version` are present in default `allowedHeaders`/`exposedHeaders`. Regression for PR #552.

**Verify:** `pnpm test:unit` — these are pure unit tests, no fixtures.

---

## Phase 4 — Adapter + platform coverage [DONE]

Compiler adapters and platform builds — high regression density (Vercel #471, Cloudflare, Next.js #472, NestJS). Shipped:

### 4.1 Fixtures

- `test/fixtures/vercel-output/` and `test/fixtures/cloudflare-output/` — built via `xmcp build --vercel` / `--cf`.
- `test/fixtures/adapter-express/`, `test/fixtures/adapter-nestjs/`, `test/fixtures/adapter-nextjs/` — one fixture per `experimental.adapter` mode. Renamed from the original `with-<framework>` proposal so the fixture name reflects what the build emits, not the consumer framework. Each ignores `dist`, `.xmcp`, `node_modules` and is wired into `pnpm-workspace.yaml`.

### 4.2 Integration tests

- `test/integration/adapter-vercel.test.ts` — `--vercel` build → asserts the Vercel function output structure under `.vercel/output/functions/` and pins it via `snapshotFileTree`.
- `test/integration/adapter-cloudflare.test.ts` — `--cf` build → asserts the Cloudflare worker entry plus `.xmcp` tree snapshot.
- `test/integration/adapter-frameworks.test.ts` — single `describe.each` over `[express, nestjs, nextjs]` instead of three sibling files. Builds each fixture, asserts `.xmcp/adapter-<mode>.js` exists, and pins per-mode export shapes (`xmcpHandler` for express/nextjs; `XmcpService` + `XmcpController` for nestjs). Smaller, easier to extend than three near-identical files.

### 4.3 HTTP stateless Layer A extension

`http-stateless.test.ts` now has a second top-level `describe("Web (Cloudflare) HTTP transport — stateless contract")` block walking `src/runtime/transports/http/web-stateless-http.ts`. Layer A there asserts forbidden-type fields are only allowed when explicitly tagged with the `@stateless: request-scoped` marker (allow-list, not blanket reject), plus a sanity check that markers exist at all. A second sub-describe walks `src/cloudflare/worker.ts` to pin the call-site contract: `WebStatelessHttpTransport` must be instantiated *inside* a function body, not at module scope, so per-request Maps never see traffic from another request.

The shared AST helper `findForbiddenStateFields` is inlined in `http-stateless.test.ts` rather than lifted to `_utils.ts` — only one consumer today, and lifting it would have meant exporting half a dozen private predicates. Easy to extract when a third caller lands.

---

## Phase 5 — File watcher [DONE]

Pinned PR #248 (file deletion regression) and PR #40 (recovery on restart). Suite now 215/215, ~8s.

### 5.1 Programmatic dev hook — no source change

Took the spawn-and-parse path. `compile()` already prints `${greenCheck} Compiled in ${ms}ms` after every successful build (`src/compiler/index.ts:397-399`), so the existing marker is the rebuild signal. New helper `spawnDevServer(fixtureName, { tempDir? })` in `test/integration/_utils.ts` copies the fixture into an isolated tempdir, rewires `node_modules` symlinks to absolute paths, spawns `xmcp dev`, and exposes `waitForRebuild()` that resolves on the next "Compiled in" line. Two named timeouts (rule #3): `WATCHER_FIRST_BUILD_TIMEOUT_MS = 30_000` (cold first build), `WATCHER_REBUILD_TIMEOUT_MS = 15_000` (incremental).

Caveat surfaced and fixed during implementation: a SIGTERM-killed child has `child.exitCode === null` and `child.signalCode === "SIGTERM"`. The original `spawnHttpServer` / `spawnStdioClient` only check `exitCode`, which is technically a bug but doesn't bite them because they never `await once(child, "exit")` after issuing SIGKILL. The new `spawnDevServer.stop()` registers the exit promise once up front and schedules SIGKILL via an unref'd timer — that pattern is now the safe template if we ever revisit the older helpers.

### 5.2 Tests

- `test/integration/file-watcher.test.ts` — five sequential cases against an isolated copy of `basic-tools`:
  - First build emits an import-map referencing the seed tool.
  - Add a new tool file → import-map regenerated to include it.
  - Modify an existing tool file → recompile fires.
  - Delete the added tool → import-map drops it (regression for PR #248).
  - Restart watch mode in the same tempdir → import-map matches on-disk truth (regression for PR #40).
- No raw `setTimeout` in the test bodies — every wait is `await server.waitForRebuild()`.

**Verified:** sabotaging `src/utils/file-watcher.ts` to drop the `unlink` listener makes the deletion test fail with `xmcp dev did not reach build #4 within 15000ms (current: 3)` — the regression bites, then I reverted.

---

## Phase 6 — Real-client e2e via @mcpjam/cli [DONE]

`@mcpjam/cli@3.3.3` (drop-in replacement for the original `@modelcontextprotocol/inspector` integration) is pinned in `packages/xmcp/devDependencies`. mcpjam wins for CI: exit-code-driven failure semantics, `--format json --quiet` for clean machine output, and one-shot `server doctor` that sweeps tools, resources, prompts, and capabilities in a single call. Shipped:

- `runMcpjam<T>` core spawner in `test/integration/_utils.ts` — resolves `@mcpjam/cli/dist/index.js` via `createRequire(...).resolve(...)`, spawns it with `--format json --quiet --no-telemetry`, and returns the parsed JSON payload. Failure surfaces via non-zero exit code (no marker scan needed). Single named timeout `MCPJAM_CLI_TIMEOUT_MS = 30_000` (rule #3).
- Typed wrappers per subcommand: `mcpjamDoctor`, `mcpjamToolsList`, `mcpjamToolsCall`, `mcpjamResourcesList`, `mcpjamResourceRead`, `mcpjamPromptsList`, `mcpjamPromptGet`, plus `mcpjamStdioTarget(name)` to point at a fixture's `dist/stdio.js`.
- `stdio-transport.test.ts` and `http-stateless.test.ts` — `via @mcpjam/cli` describe blocks driving `tools list` and `tools call` against the `basic-tools` fixture.
- New fixture `test/fixtures/mcpjam-testbed/` with one tool (`echo`), one resource (`testbed://readme`), and one prompt (`greet`) — first fixture to exercise resources and prompts.
- New `test/integration/mcpjam-conformance.test.ts` — 18 tests covering tools/resources/prompts × stdio/http × `basic-tools`/`mcpjam-testbed`. Gated by `MCPJAM_E2E=1` so the default `pnpm test` skips it; `pnpm e2e:fast` runs the `[fast]`-tagged subset (4 tests, ~3s); `pnpm e2e:full` runs all 18 (~9s).
- CI tiering: `ci.yml` runs `pnpm e2e:fast` on every PR after the regular test job; `examples-smoke.yml` runs `pnpm e2e:full` gated to canary/main pushes and PRs labeled `full-e2e`.

**Verified:** 18/18 conformance tests pass; e2e:fast subset runs in ~3s, full sweep in ~9s.

---

## Phase 7 — Cross-platform CI [DONE]

`.github/workflows/ci.yml` `test` job now runs the 2×2 matrix `os: [ubuntu-latest, macos-latest] × node-version: [20.x, 22.x]` with `fail-fast: false`. Windows is intentionally skipped — slow + flaky on shared runners and most xmcp users don't ship from Windows; the inline comment in `ci.yml` documents this and points to the separate `cross-platform.yml` workflow that smokes the CLI on Windows so we're not flying blind there.

`realpathSync` divergence is already covered by `test/unit/compiler/utils/config-detection.test.ts` and runs green on macOS as part of the matrix.

---

## Phase 8 — Full examples E2E [DONE]

`.github/workflows/examples.yml` now ships an `examples-build` matrix job alongside the original `cli-smoke`. Each committed example under `examples/` is a matrix cell with `{ name, class, artifact }` — the workflow runs `xmcp build` directly (not the example's `pnpm build`, since some scripts chain a never-exiting `dev` step) and asserts the expected `artifact` exists. `fail-fast: false` so one breaking example doesn't mask others.

**Trigger:** push to `main`/`canary`, manual dispatch, or a `full-examples` PR label for opt-in runs on PRs that touch the compiler/runtime. Build-only — no runtime smoke yet; that's the natural follow-up if a class of regression slips past the artifact check.

---

## Phase 9 — Coverage thresholds + perf [DONE]

### 9.1 Coverage baseline

`packages/xmcp/vitest.config.ts` now has a `coverage` block (v8 provider, `src/**/*.ts` include, types/dist/bundler/test excluded) with thresholds pinned at the baseline minus ~2 points: `statements: 14, branches: 11, functions: 14, lines: 14`. The numbers look low because most of `src/` is exercised by integration tests that spawn separate node processes — those don't show up in v8 coverage of the test process itself. The inline comment in the config documents this and explains how to recapture (`pnpm test:coverage`) as new unit tests land.

`packages/xmcp/package.json` exposes `"test:coverage": "vitest run --coverage"` and `.github/workflows/ci.yml` runs it in its own step so the threshold floor is enforced on every PR.

### 9.2 Performance regression

`test/integration/perf.test.ts` — catastrophic-regression detector with two cases:

- `xmcp build` of `basic-tools` 3x cold runs, all under `BUILD_CEILING_MS = 30_000`.
- HTTP cold start (spawn → `/health` 200) under `COLD_START_CEILING_MS = 15_000` (gives margin under the existing 20s `SERVER_STARTUP_TIMEOUT_MS` so the perf assertion fires before the helper times out).

Fixed absolute ceilings, not relative drift — sustained drift tracking would need a checked-in baseline + statistical comparison, deferred to a future 9.3 follow-up if it ever pays for itself. Gated on `PERF=1` (skipped by default) because perf signals are too noisy on shared PR runners; run locally with `PERF=1 pnpm test:integration -- integration/perf.test.ts` or wire `PERF=1` into the canary/main push workflow when ready.

---

## Phase 10 — Other packages [DONE]

Every workspace package with substantive logic now has a vitest suite; the root `pnpm test:all` runs ten of them in one sweep.

### 10.1 cli — DONE

`packages/cli/test/unit/cli.test.ts` ported from `tsx --test` to vitest. `packages/cli/package.json` now exposes `test`, `test:watch`, `test:ci` scripts on `vitest ^4.1.5`.

### 10.2 init-xmcp — DONE

`packages/init-xmcp/test/unit/{generate-config,update-tsconfig}.test.ts` ported. Same vitest setup as cli.

### 10.3 create-xmcp-app — DONE

`packages/create-xmcp-app/test/unit/scaffold.test.ts` — scaffolds into a tempdir and validates the file tree against a snapshot under `test/unit/__snapshots__/`. Same vitest setup.

### 10.4 plugins/* — DONE

The original `workos` typecheck failure flagged in the brief is no longer reproducible — `pnpm --filter @xmcp-dev/workos build` now succeeds clean, no further work needed there.

Six of the eight plugin packages got focused unit tests targeting pure helpers — no live SDK calls, no built dist required. Each plugin gets its own `vitest.config.ts` (mirrored from cli/init-xmcp), `test/unit/*.test.ts`, and `test`/`test:watch`/`test:ci` scripts on `vitest ^4.1.5`:

| Plugin | Test file | What it pins |
|---|---|---|
| `auth0` | `permissions.test.ts` | Null-client guards return null without throwing; `fetchResourceServerScopes` filters non-string scope values; `fetchUserPermissions` filters by audience; SDK rejection is swallowed (logged + null) — 6 cases |
| `better-auth` | `utils.test.ts` | `processProvidersResponse` shapes — empty, email-only, google with both id+secret exposes only `enabled` flag (never the secret), partial google config dropped — 5 cases |
| `clerk` | `jwt.test.ts` | `getIssuer` (bare/https/http normalization), `extractBearerToken` (well-formed, case-insensitive scheme, malformed/missing → null), `claimsToSession` (unix-second exp/iat → Date) — 7 cases |
| `workos` | `jwt.test.ts` | Same Bearer-token + claims-to-session contract as clerk, plus `getAuthKitBaseUrl` — 5 cases |
| `x402` | `registry.test.ts` | `globalThis`-backed singleton Map: `register/has/get` round-trip, last-write-wins on duplicate keys, `clear()` empties — 4 cases. `beforeEach` clears the singleton so tests don't leak |
| `polar` | `provider.test.ts` | `PolarProvider.getInstance` returns the same instance regardless of subsequent config; defaults `type` to production; routes to sandbox endpoint when configured; `getMeterIdFromProduct` prefers `meter_id` over `id`, throws when no meter_credit benefit present — 5 cases. Resets the static `instance` field via cast in `beforeEach` since the class doesn't expose a reset hook |

**Skipped intentionally:**
- `commet` — 60 lines total of thin SDK delegation; no logic worth pinning without mocking `@commet/node`'s full surface. Add tests if substantive logic lands.
- `mpp`, `sandbox` — empty stubs (no `package.json`, no `src/`). Skipped.

**Total:** 32 new tests across 6 plugins, all under 150ms each.

### 10.5 `pnpm test:all` — DONE

Root `package.json` exposes `"test:all": "turbo run test"`. It now runs all ten packages with vitest suites: xmcp, cli, init-xmcp, create-xmcp-app, and the six plugins above. Workspace total: **278 passing / 2 skipped** (the two skipped are xmcp's PERF=1-gated cases).

---

## Phase 11 — Snapshot testing [DONE]

`snapshotFileTree(rootDir)` helper in `_utils.ts:96` returns a sorted POSIX-style relative file list for vitest's `toMatchSnapshot()`. Used by:

- `compile.test.ts` — snapshots `dist/` for `basic-tools`, `empty-paths`, `custom-paths`.
- `adapter-vercel.test.ts` — snapshots `.vercel/output/` after a `--vercel` build.
- `adapter-cloudflare.test.ts` — snapshots `.xmcp/` after a `--cf` build.
- `adapter-frameworks.test.ts` — snapshots `.xmcp/` per adapter mode.

Snapshots live under `test/integration/__snapshots__/` (vitest convention) and are excluded from the npm tarball by the existing `pack-check` glob. Update intentionally with `pnpm test -u`.

---

## Outstanding work

All eleven phases are DONE. Optional follow-ups if regressions surface:

- `commet` plugin — currently skipped (thin SDK wrapper); revisit if substantive logic lands.
- `mpp` and `sandbox` plugins — empty stubs; nothing to test until they ship code.
- xmcp `perf.test.ts` — gated on `PERF=1`. Wire `PERF=1` into a canary push step if a soft drift detector ever lands (Phase 9.3 placeholder).

## How to start a follow-up in a new chat

Tell the new chat:

> Read `packages/xmcp/test/ROADMAP.md`. The full plan is shipped — pick up one of the listed follow-ups. Don't expand scope. Run `/review-rules` on your diff before handing back.

The new chat has everything it needs: file paths, fixture pattern, helper inventory, review rules, and the verification expectation per phase.
