# xmcp conformance tests

Private test infrastructure for compiled xmcp applications. Requires Node 22 and
pnpm 10.8.1. Install workspace dependencies with `pnpm install --frozen-lockfile`.

```sh
pnpm run test:unit
pnpm --filter @xmcp-dev/e2e typecheck
pnpm --filter @xmcp-dev/e2e test:fast
pnpm --filter @xmcp-dev/e2e test
```

Both E2E commands build the local runtime and compiler through Turbo before
generating and compiling real fixture projects. No global xmcp installation,
external server, credentials, or deployed infrastructure is required. The root
aliases are `test:e2e:fast` and `test:e2e`.

## Coverage

| Command     | Targets                                             | Module formats | Protocol modes   |
| ----------- | --------------------------------------------------- | -------------- | ---------------- |
| `test:fast` | Standalone HTTP, STDIO                              | CommonJS, ESM  | `auto`, `legacy` |
| `test`      | Fast targets plus Express, Fastify, NestJS, Next.js | CommonJS, ESM  | `auto`, `legacy` |

The shared checks cover tool discovery, input/output schemas, annotations,
structured results, invalid arguments, application errors, client identity,
prompts, static resources, resource templates, and tool input requests. HTTP
targets additionally verify independent requests without sessions and that
client identity comes from the current request. Capability-based skips include
a reason: HTTP-specific checks are skipped for STDIO, and input requests are
skipped for stateless legacy HTTP, which cannot receive server-to-client requests.

`auto` uses the SDK's modern discovery negotiation; `legacy` explicitly selects
the initialize handshake. CommonJS fixtures use the default package format (no
`type` field), matching existing projects; explicitly setting `type: commonjs`
currently makes the compiler reject its generated ESM import map. ESM fixtures
set `type: module`. Next.js hosts the compiled xmcp adapter in a real
App Router development server. This does not test Next.js production packaging
or cloud deployments. The existing `scripts/test-split-e2e.sh` remains responsible
for package distribution and standalone bundle checks.

PR CI runs the fast matrix. `nightly.yml` runs the full matrix daily at 06:00 UTC
and can also be dispatched manually.

## Fixtures and diagnostics

`src/harness/project-files.ts` contains the shared tools, prompts, resources, and
adapter hosts. `createFixture` writes each application into a unique `.work/`
directory, links already installed workspace dependencies, and invokes the local
xmcp build CLI. Framework dependencies are confined to this private test package
and reuse packages already present in the repository.

Each fixture owns its build output and dependency links. Tests run sequentially
to keep compiler and framework memory use bounded. Hosts signal readiness when
they listen; named timeouts bound builds, startup, requests, and shutdown. HTTP
child process groups are terminated during teardown. STDIO teardown uses the
SDK transport's child-process lifecycle.

Successful fixtures are removed. Failed fixtures remain under `.work/` with
`build.log` and `server-<mode>.log`; errors print their location. CI uploads only
these logs on failure. `.work/` is gitignored and must never be committed.

To rerun a single target after building the packages, use Node's test-name filter:

```sh
pnpm --filter @xmcp-dev/e2e exec node --import tsx --test --test-name-pattern='express/commonjs' src/tests/adapters.test.ts
```

## Per-feature fixtures

Pass optional `files` and `configFragment` fields to `createFixture` to add a
feature's tools, prompts, resources, middleware, or configuration:

```ts
const fixture = await createFixture({
  kind: "http",
  moduleType: "module",
  files: {
    "src/tools/feature.ts": `export const metadata = { name: "feature" };
export default function feature() { return "feature result"; }
`,
  },
  configFragment: `template: {
    ...defaultConfig.template,
    instructions: "Use the feature tool to try this fixture.",
  },`,
});
```

Files are written after all defaults, including adapter hosts, and before the
xmcp build. Matching paths replace default files; other defaults remain intact.
Paths must be relative to the fixture directory and cannot escape it or write
into its linked `node_modules` directory.

`configFragment` contains TypeScript object members, without an enclosing object
or `export default`. They follow `...defaultConfig` in the generated config, so
matching top-level fields replace defaults. Spread `defaultConfig.http`,
`defaultConfig.template`, or another existing field when extending a nested
object to retain its defaults. The fragment may include functions and expressions;
it is trusted test source, not JSON or a deep merge. A file override for
`xmcp.config.ts` replaces the entire generated config, including the fragment.

Omitting both options retains the standard fixture. Both E2E commands include
`src/tests/fixtures.test.ts`, which checks added tool discovery, file replacement,
default tool preservation, and custom server instructions through a real HTTP
client.

Feature-scoped registration modules and the client-under-test harness belong to
subsequent roadmap entries. No public API changes or separate website/example
updates are needed: the generated applications are the runnable test examples.
