# xmcp testsuite

vitest-driven testsuite for the `xmcp` package.

## Layout

```
test/
├── unit/           Fast in-process tests; mirror the source tree
├── integration/    Spawn-based tests that build fixtures and drive servers
├── fixtures/       Minimal xmcp apps used as integration inputs
└── README.md       This file
```

Tests live under `test/` rather than `src/__tests__/` so the npm tarball stays clean — the `files` field in `package.json` allowlists `dist` and `src`, which excludes everything in `test/` automatically.

## How to run

| Command                 | Scope                                                            |
| ----------------------- | ---------------------------------------------------------------- |
| `pnpm test`             | All tests (unit + integration) — **verbose** reporter locally    |
| `pnpm test:ui`          | Browser UI (`@vitest/ui`) — file tree, source view, re-run, etc. |
| `pnpm test:watch`       | Interactive watch mode (vitest TUI)                              |
| `pnpm test:unit`        | Unit only                                                        |
| `pnpm test:integration` | Integration only                                                 |
| `pnpm test:coverage`    | With v8 coverage                                                 |
| `pnpm test:ci`          | Forces CI-mode reporter locally (compact, no per-test names)     |

Integration tests spawn the built `dist/cli.js`, so run `pnpm build` first (or use turbo: `pnpm test` from the repo root chains build → test automatically).

### Reporters: local vs CI

The vitest config switches reporters based on `process.env.CI`:

- **Local (`CI` unset):** `verbose` — every test name scrolls by as it runs, useful for the slower integration suite where you want a live progress signal.
- **CI (`CI=1`):** `default` — compact summary, fewer log lines.
- **GitHub Actions (`GITHUB_ACTIONS=1`):** `default` + `github-actions` — failures become inline annotations on the PR.

A hook or pre-commit script that wants quiet output can run `CI=1 pnpm test` (same as the `test:ci` script).

## The HTTP transport stateless contract

`integration/http-stateless.test.ts` enforces two layers:

**Layer A (code-shape).** Parses `src/runtime/transports/http/stateless-streamable-http.ts` with the TypeScript compiler API and asserts:

1. `StreamableHTTPServerTransport` is constructed with `sessionIdGenerator: undefined`.
2. `StatelessStreamableHTTPTransport` has no class field of type `Map`, `Set`, `WeakMap`, or `Cache` (allow-list lives in the test).
3. `handleStatelessRequest` invokes `this.createServerFn(` (per-request server, never reused).
4. `res.on("close", …)` cleanup is wired.
5. `/health` returns `mode: "stateless"`.

**Layer B (live behaviour).** Builds `fixtures/basic-tools`, spawns the HTTP server, drives it through both the MCP Inspector CLI (protocol round-trips) and direct `fetch` (transport-shape assertions like missing `Mcp-Session-Id` header, concurrency, identical responses across server restarts).

### To verify the test bites

This is the meta-test — run it once after big changes to confirm Layer A still catches regressions.

1. Add `private sessions = new Map<string, any>()` to `StatelessStreamableHTTPTransport`. Run `pnpm test:integration`. Expect a clear failure naming the offending field. Revert.
2. Change `sessionIdGenerator: undefined` to `() => "x"`. Expect Layer A to fail naming the property. Revert.

Both regressions have happened in this codebase before (PR #559, reverted by `a69f7d6`). The point of this test is to catch them at PR time.

## Fixtures

Each fixture is a self-contained xmcp app: `package.json` (no install needed — uses workspace xmcp), optional `xmcp.config.ts`, and `src/tools/` / `src/prompts/` / `src/resources/`.

| Fixture       | What it covers                                          |
| ------------- | ------------------------------------------------------- |
| `basic-tools` | One tool, default paths — happy-path build + transports |
| `empty-paths` | No tools/prompts/resources — must build cleanly         |
| `custom-paths`| Non-default `paths` config                              |

Loader edge cases (empty files, missing default exports, non-function defaults) are covered in unit tests at `test/unit/runtime/utils/{tool,resource,prompt}-loader.test.ts` rather than via fixtures.

## Adding a test

- Unit: drop a `*.test.ts` under `test/unit/<mirror path>/`. Import source via the `@/` alias (configured in `vitest.config.ts`).
- Integration: drop a `*.test.ts` under `test/integration/`. Use helpers from `_utils.ts` (`buildFixture`, `spawnHttpServer`, `postJsonRpc`, etc.) — don't roll your own spawn or fetch boilerplate.

Avoid magic `setTimeout` waits (review rule #3). Use `await once(child, "exit")`, `vi.waitFor(...)`, or the polling helpers in `_utils.ts`.
