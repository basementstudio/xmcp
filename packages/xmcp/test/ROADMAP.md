# xmcp testsuite — roadmap

Track of what was shipped in the foundation PR and what to land next, organised so each follow-up is a focused PR (review rule #10). A new chat should be able to pick up any phase from cold.

---

## Quick context for a fresh chat

- **Test runner:** vitest 4.1.5 (configured at `packages/xmcp/vitest.config.ts`, root config at `vitest.config.ts`).
- **Layout:** `packages/xmcp/test/{unit,integration,fixtures}/`. Tests live outside `src/` because the npm tarball uses `"files": ["dist", "src"]` — see `packages/xmcp/package.json:79-82`. CI job `pack-check` enforces it.
- **Path alias:** `@/*` → `src/*` (configured in vitest.config.ts).
- **Helpers:** `test/integration/_utils.ts` exposes `buildFixture`, `spawnHttpServer`, `spawnStdioClient`, `postJsonRpc`, `findFreePort`. Use them — don't roll your own spawn/fetch.
- **Fixtures:** `test/fixtures/{basic-tools,empty-paths,custom-paths}/`. Each is a workspace package (added to `pnpm-workspace.yaml`). Add new fixtures the same way.
- **Reporters:** `process.env.CI` switches the reporter. Local = verbose, CI = default, GitHub Actions = default + `github-actions`.
- **CI:** `.github/workflows/ci.yml` (4 jobs on every PR). Slow CLI/example smoke is in `.github/workflows/examples.yml` (push to canary/main only).
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

**Total:** 174 tests, ~8s end-to-end, 13 test files.

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

## Phase 4 — Adapter + platform coverage [L, ~6h]

Compiler adapters and platform builds — high regression density (Vercel #471, Cloudflare, Next.js #472, NestJS).

### 4.1 New fixtures

- `test/fixtures/vercel-output/` — `xmcp.config.ts` with `experimental.adapter: 'vercel'`-equivalent (read `src/cli/index.ts` for the actual flag wiring; build is invoked via `xmcp build --vercel`).
- `test/fixtures/cloudflare-output/` — same shape, `--cf` flag.
- `test/fixtures/with-express/`, `test/fixtures/with-nestjs/`, `test/fixtures/with-nextjs/` — adapter modes.

Pattern follows the existing `test/fixtures/basic-tools/`. Don't forget `.gitignore` (dist, .xmcp, node_modules) and add to `pnpm-workspace.yaml`.

### 4.2 New integration tests

- `test/integration/adapter-vercel.test.ts` — build with `--vercel`, assert the Vercel function output structure under `.vercel/output/functions/`.
- `test/integration/adapter-cloudflare.test.ts` — build with `--cf`, assert `dist/cloudflare/worker.js` exists and contains the runtime entry.
- `test/integration/adapter-express.test.ts`, `adapter-nestjs.test.ts`, `adapter-nextjs.test.ts` — build the adapter mode, smoke that the adapter output exposes the MCP endpoint.

### 4.3 Extend HTTP stateless Layer A

`test/integration/http-stateless.test.ts` Layer A currently only walks `stateless-streamable-http.ts`. Extend to also walk `src/runtime/transports/http/web-stateless-http.ts` (the Cloudflare Workers variant). It already has request-local Maps (allowed) — needs an explicit allow-list assertion rather than a blanket reject.

Refactor the AST helper into `_utils.ts` so both files share one walker.

**Verify:** statelessness regression sim still bites for both files when an offending field is added.

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

## Phase 6 — MCP Inspector integration [M, ~3h, BLOCKED]

The official `@modelcontextprotocol/inspector` CLI is the canonical MCP client. Driving the integration tests through it gives free protocol-conformance coverage.

**Blocked on:** `@modelcontextprotocol/sdk` bump from `^1.26.0` to `^1.29.0+`. Inspector 0.21+ requires SDK 1.29+; with 1.26 we get `Cannot read properties of undefined (reading 'def')` at runtime.

When the SDK is bumped:

1. `pnpm add -D @modelcontextprotocol/inspector` in `packages/xmcp/`.
2. Add an `inspectorCli` helper to `_utils.ts` that wraps `npx @modelcontextprotocol/inspector --cli node <entry> --method <m>` with JSON output parsing.
3. Augment `stdio-transport.test.ts` and `http-stateless.test.ts` Layer B with inspector-driven `tools/list` + `tools/call` round-trips. Keep direct fetch for header-shape assertions.

**Verify:** inspector's CLI exits 0 for valid invocations, returns parseable JSON for `tools/list`/`tools/call`.

---

## Phase 7 — Cross-platform CI [S, ~1h]

Add macOS to the CI matrix. Watcher and FS-realpath bugs are the highest-value catches.

### 7.1 Update `.github/workflows/ci.yml`

In the `test` job, expand:
```yaml
strategy:
  fail-fast: false
  matrix:
    os: [ubuntu-latest, macos-latest]
    node-version: [20.x, 22.x]
runs-on: ${{ matrix.os }}
```

Skip Windows for now — slow, flaky, and most xmcp users don't ship from Windows. Revisit if path-separator bugs surface.

### 7.2 Macos-specific

- `realpathSync` differences (already used in `test/unit/compiler/utils/config-detection.test.ts`). Run the suite on macOS and fix anything that breaks.

**Verify:** all four matrix cells green on a draft PR.

---

## Phase 8 — Full examples E2E [L, ~5h]

Expand `.github/workflows/examples.yml` from the current single CLI smoke into a build-each-example sweep.

### 8.1 Catalogue

There are 48 example directories under `examples/`. Group by class:

- Transports: `http-transport`, `stdio-transport`, `cloudflare-workers`.
- Adapters: `with-nextjs`, `with-nestjs`, etc.
- Auth: `auth-native-oauth`, `auth0-http`, `clerk-http`, `better-auth-http`, etc.
- Middleware: `middlewares-jwt`, `middlewares-api-key`, `middlewares-array`, `middlewares-custom`.
- Specials: `mcp-app-react`, `mcp-app-css-modules`, `with-nextjs-ai-sdk`.

### 8.2 Workflow

For each example, in a matrix:
1. `pnpm install`
2. `pnpm build` (using the workspace xmcp)
3. Smoke: `node dist/<entry>.js --help` or a programmatic `tools/list` round-trip.

Use `fail-fast: false` so one breaking example doesn't mask others.

### 8.3 Trigger

Keep on push to `canary`/`main` only. Optionally add a `[full-examples]` PR label trigger for opt-in PR runs.

**Verify:** every matrix cell completes; failures show which example regressed.

---

## Phase 9 — Coverage thresholds + perf [M, ~3h]

### 9.1 Coverage baseline

- Run `pnpm test:coverage` once on a clean tree, capture the baseline percentages per directory.
- Add to `vitest.config.ts`:
  ```ts
  coverage: {
    thresholds: {
      lines: <baseline_minus_2>,
      functions: <baseline_minus_2>,
      branches: <baseline_minus_2>,
      statements: <baseline_minus_2>,
    }
  }
  ```
- Wire `pnpm test:coverage` into CI as a separate (non-blocking initially) job.

### 9.2 Performance regression

- `test/integration/perf.test.ts` — build `basic-tools` 3x, assert wall time stays under a soft threshold (e.g. 5x median of last 10 runs stored in a checked-in baseline).
- Cold-start: spawn http server, measure time from spawn to `/health` 200.
- Run on push to canary only (not every PR — too noisy).

---

## Phase 10 — Other packages [L, ~6h]

xmcp is now wired up. The other workspace packages have their own ad-hoc tests that don't run.

### 10.1 cli (`packages/cli`)

Has `__tests__/cli.test.ts` (uses `tsx --test`). Port to vitest, mirror the xmcp setup:
- `packages/cli/vitest.config.ts`
- `packages/cli/test/unit/`
- Add `test` script to `packages/cli/package.json`
- Already uses node:test; conversion is mechanical.

### 10.2 init-xmcp (`packages/init-xmcp`)

Has `src/__tests__/{generate-config,update-tsconfig}.test.ts`. Same migration.

### 10.3 create-xmcp-app

No tests currently. Add a smoke test that scaffolds into a tempdir and validates the file tree matches the expected template.

### 10.4 plugins/clerk, plugins/x402, plugins/workos

`workos` currently has a build typecheck failure (express types version mismatch — pre-existing, surfaced when I ran `pnpm test:all` early). Fix the typecheck or scope tests to skip workos.

### 10.5 Re-enable `pnpm test:all`

Once each package has a passing `test` script, the root `pnpm test:all` (which uses turbo to run `test` everywhere) becomes useful.

---

## Phase 11 — Snapshot testing [S, ~2h]

Pin the compiler's output shape per fixture. Catches accidental changes to the dist tree.

- For each fixture, snapshot the file list under `dist/` (sorted).
- Use vitest's `toMatchSnapshot()` against `fs.readdirSync(distDir, { recursive: true }).sort()`.
- Snapshots live in `__snapshots__/` next to the test files (vitest convention) and are gitignored from npm via the `pack-check` glob already.

---

## How to start a phase in a new chat

Tell the new chat:

> Read `packages/xmcp/test/ROADMAP.md`. We finished Phase 1. Pick up Phase **N** (`<phase-name>`). Don't expand scope. Run `/review-rules` on your diff before handing back.

The new chat has everything it needs: file paths, fixture pattern, helper inventory, review rules, and the verification expectation per phase.
