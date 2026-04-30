import { buildFixture } from "./integration/_utils";

// Build every fixture once before any test file runs. Without this, multiple
// integration test files build the same fixture in parallel and trash each
// other's dist via the rm-dist preamble. compile.test.ts re-runs builds to
// inspect output; other tests just trust the dist is present.
export default async function setup() {
  for (const name of [
    "basic-tools",
    "empty-paths",
    "custom-paths",
    "mcpjam-testbed",
  ] as const) {
    const result = await buildFixture(name);
    if (result.exitCode !== 0) {
      throw new Error(
        `Global fixture build failed for "${name}" (exit ${result.exitCode}):\n` +
          result.stderrChunks.join("") +
          "\n" +
          result.stdoutChunks.join("")
      );
    }
  }
}
