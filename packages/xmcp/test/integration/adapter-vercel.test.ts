import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { buildFixture, fixturePath, snapshotFileTree } from "./_utils";

// `xmcp build --vercel` produces a Vercel Build Output v3 directory at
// `.vercel/output/`. The pieces we pin here are the contract Vercel reads:
// the function entrypoint and its `.vc-config.json` runtime descriptor.
// (Source: packages/xmcp/src/platforms/build-vercel-output.ts.)
describe("adapter — vercel", () => {
  const FIXTURE = "vercel-output";

  it("emits the expected .vercel/output structure", async () => {
    const result = await buildFixture(FIXTURE, {
      args: ["--vercel"],
      cleanPaths: [".vercel"],
    });
    expect(
      result.exitCode,
      `vercel build failed:\n${result.stderrChunks.join("")}\n${result.stdoutChunks.join("")}`
    ).toBe(0);

    const fixtureDir = fixturePath(FIXTURE);
    const outputDir = path.join(fixtureDir, ".vercel", "output");
    const functionDir = path.join(
      outputDir,
      "functions",
      "api",
      "index.func"
    );

    // Top-level config Vercel reads to discover the function set.
    await expect(
      fs.access(path.join(outputDir, "config.json"))
    ).resolves.toBeUndefined();

    // The function entrypoint and runtime descriptor.
    await expect(
      fs.access(path.join(functionDir, "index.js"))
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(functionDir, ".vc-config.json"))
    ).resolves.toBeUndefined();
    await expect(
      fs.access(path.join(functionDir, "package.json"))
    ).resolves.toBeUndefined();

    // The bundled function must include the http server entry — the build
    // copies dist/http.js → functions/api/index.func/index.js.
    const fnEntry = await fs.readFile(
      path.join(functionDir, "index.js"),
      "utf8"
    );
    expect(fnEntry.length).toBeGreaterThan(0);

    // Snapshot the full .vercel/output/ tree so any layout drift (added
    // chunks, renamed entry, missing config) is caught even if the explicit
    // assertions above still pass. Update with `pnpm test -u` when the
    // change is intentional.
    const tree = await snapshotFileTree(outputDir);
    expect(tree).toMatchSnapshot();
  }, 90_000);
});
