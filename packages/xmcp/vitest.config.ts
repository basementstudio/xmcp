import { defineConfig } from "vitest/config";
import path from "node:path";

// CI / hooks set CI=1; that's our switch for compact, machine-friendly output.
// Locally, prefer the verbose reporter so each test name scrolls by — slower
// integration tests benefit from the live progress signal. In GitHub Actions
// also emit inline PR annotations on failures via the github-actions reporter.
const isCI = !!process.env.CI;
const isGitHubActions = !!process.env.GITHUB_ACTIONS;

const reporters = isCI
  ? isGitHubActions
    ? (["default", "github-actions"] as const)
    : (["default"] as const)
  : (["verbose"] as const);

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    globals: false,
    include: ["test/**/*.test.ts"],
    globalSetup: ["./test/global-setup.ts"],
    testTimeout: 30_000,
    hookTimeout: 90_000,
    // Type-level tests live in test/types/*.test-d.ts. These are tsc errors,
    // not runtime assertions: they fail the build when a public type signature
    // breaks. Always-on so accidental changes to the published surface bite
    // immediately, not at the next user bug report.
    typecheck: {
      enabled: true,
      include: ["test/types/**/*.test-d.ts"],
      tsconfig: "./tsconfig.test.json",
    },
    // Integration tests share fixture dist directories — running them in
    // parallel forks racing rm/build steps. Serializing is fast enough
    // here (~8s) and avoids the whole class of race.
    fileParallelism: false,
    reporters: [...reporters],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/types/**",
        "dist/**",
        "bundler/**",
        "test/**",
      ],
      // Regression floor pinned at the current baseline minus ~2 points
      // (capture: 17.55% statements / 14.54% branches / 17.33% functions /
      // 17.42% lines). Numbers look low because most of src/ is exercised
      // by integration tests that spawn separate node processes — those
      // don't show up in v8 coverage of the test process.
      //
      // Several files in src/telemetry/events (post-payload, detached-flush,
      // tracker) and src/telemetry/storage are intentionally not unit-tested:
      // they spawn detached processes, post to external endpoints with retry,
      // or do disk IO that would require heavy mocking with little payoff.
      // They surface in coverage at 0% by design — counted in the floor so
      // someone adding indirect coverage gets credit for it.
      //
      // Enforced by the `coverage` job in .github/workflows/ci.yml. Raise
      // as new unit tests land; recapture with `pnpm test:coverage`.
      thresholds: {
        statements: 15.5,
        branches: 12.5,
        functions: 15.3,
        lines: 15.4,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
