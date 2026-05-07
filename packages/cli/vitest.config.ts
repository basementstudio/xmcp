import { defineConfig } from "vitest/config";

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
    testTimeout: 30_000,
    // The test spawns `node dist/index.js` per case — serializing keeps the
    // generated tempdirs from racing if cases are added that share a fixture.
    fileParallelism: false,
    reporters: [...reporters],
  },
});
