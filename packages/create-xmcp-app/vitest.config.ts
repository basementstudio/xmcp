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
    // Each case spawns the cli + scaffolds into a fresh tempdir; serialise
    // so tempdirs don't race or share heat under parallel forks.
    fileParallelism: false,
    testTimeout: 60_000,
    reporters: [...reporters],
  },
});
