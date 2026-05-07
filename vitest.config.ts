import { defineConfig } from "vitest/config";

// Each package opts in by adding its own vitest.config.ts under packages/<name>/.
// Glob auto-discovers them, so future packages onboard for free.
export default defineConfig({
  test: {
    projects: ["packages/*"],
  },
});
