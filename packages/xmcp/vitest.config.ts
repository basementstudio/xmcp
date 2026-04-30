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
      // (capture: 16.4% statements / 13.49% branches / 16% functions /
      // 16.38% lines). Numbers look low because most of src/ is exercised
      // by integration tests that spawn separate node processes — those
      // don't show up in v8 coverage of the test process. Enforced by
      // the `coverage` job in .github/workflows/ci.yml. Raise as new unit
      // tests land; recapture with `pnpm test:coverage`.
      thresholds: {
        statements: 14,
        branches: 11,
        functions: 14,
        lines: 14,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
