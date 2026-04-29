import { describe, it, expect } from "vitest";
import { buildFixture, spawnHttpServer } from "./_utils";

// Catastrophic-regression detector. Fixed absolute ceilings, not relative
// drift — sustained drift tracking would need a checked-in baseline and
// statistical comparison, which this first cut intentionally skips
// (deferred to a Phase 9.3 follow-up if it ever pays for itself). These
// thresholds catch "the build is broken" or "the server can't start"
// failures, not "the build is 30% slower".
//
// Reason for the chosen ceilings:
// - Cold `xmcp build` of basic-tools is ~1s on a developer laptop and
//   ~3-5s on a cold CI runner (measured locally before writing this test).
//   30s catches a 30x regression, which is the level at which "what
//   happened" is the right question, not "is this noise".
// - HTTP cold start is bound by the existing 20s SERVER_STARTUP_TIMEOUT_MS
//   in _utils.ts; 15s here gives margin under that ceiling so the perf
//   assertion fires before the helper itself times out.
//
// Gated on PERF=1 because perf signals are too noisy on shared PR runners.
// Run locally: PERF=1 pnpm test:integration -- integration/perf.test.ts
// Run in CI:   set PERF=1 in the workflow step (e.g. canary/main push only).
const PERF_ENABLED = process.env.PERF === "1";

const BUILD_CEILING_MS = 30_000; // see comment above
const COLD_START_CEILING_MS = 15_000; // see comment above
const BUILD_ITERATIONS = 3; // small sample, but each iteration is full work

describe.skipIf(!PERF_ENABLED)("perf — catastrophic regression detector", () => {
  it(
    `xmcp build of basic-tools stays under ${BUILD_CEILING_MS}ms across ${BUILD_ITERATIONS} cold runs`,
    async () => {
      const durations: number[] = [];
      for (let i = 0; i < BUILD_ITERATIONS; i++) {
        const start = Date.now();
        const result = await buildFixture("basic-tools");
        const ms = Date.now() - start;
        expect(
          result.exitCode,
          `build iteration ${i + 1} failed:\n${result.stderrChunks.join("")}`
        ).toBe(0);
        durations.push(ms);
      }
      const max = Math.max(...durations);
      // Surface the per-run numbers in the failure message — without them
      // a CI red light tells you nothing about whether you regressed by
      // 5% or 50x.
      expect(
        max,
        `build durations (ms): [${durations.join(", ")}]; ceiling ${BUILD_CEILING_MS}ms`
      ).toBeLessThanOrEqual(BUILD_CEILING_MS);
    },
    BUILD_CEILING_MS * BUILD_ITERATIONS + 30_000
  );

  it(
    `http server cold start (spawn → /health 200) stays under ${COLD_START_CEILING_MS}ms`,
    async () => {
      // Build once outside the timed region — cold start measures runtime
      // boot, not compile.
      const built = await buildFixture("basic-tools");
      expect(built.exitCode).toBe(0);

      const start = Date.now();
      const server = await spawnHttpServer("basic-tools");
      try {
        const res = await fetch(`http://127.0.0.1:${server.port}/health`);
        expect(res.status).toBe(200);
        const elapsed = Date.now() - start;
        expect(
          elapsed,
          `cold start ${elapsed}ms; ceiling ${COLD_START_CEILING_MS}ms`
        ).toBeLessThanOrEqual(COLD_START_CEILING_MS);
      } finally {
        await server.stop();
      }
    },
    90_000
  );
});
