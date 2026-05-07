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
    reporters: [...reporters],
  },
});
