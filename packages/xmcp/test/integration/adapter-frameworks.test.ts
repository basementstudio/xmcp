import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs/promises";
import { buildFixture, fixturePath } from "./_utils";

// Smoke coverage for the three framework adapter modes (`experimental.adapter`
// = "express" | "nestjs" | "nextjs"). The xmcp build emits a runtime shim at
// `.xmcp/adapter-<mode>.js` plus a typed handler at `.xmcp/adapter/index.{js,d.ts}`
// — that's what the user's framework code imports from `@xmcp/adapter`. We
// don't spin up the framework itself: the user owns the server entry. We only
// pin that the build still produces the contract the shipped examples
// (examples/with-{express,nestjs,nextjs}) depend on.
//
// Each mode exposes a different import surface: express + nextjs export the
// `xmcpHandler` function; nestjs exports a service/controller pair plus its
// auth/OAuth helpers. `expectExports` lists what each example wires up to.
const ADAPTER_MODES = [
  {
    mode: "express",
    fixture: "adapter-express",
    expectExports: ["xmcpHandler"],
  },
  {
    mode: "nestjs",
    fixture: "adapter-nestjs",
    expectExports: ["XmcpService", "XmcpController"],
  },
  {
    mode: "nextjs",
    fixture: "adapter-nextjs",
    expectExports: ["xmcpHandler"],
  },
] as const;

describe.each(ADAPTER_MODES)(
  "adapter — $mode",
  ({ mode, fixture, expectExports }) => {
    it("emits .xmcp/adapter-<mode>.js + .xmcp/adapter/index.{js,d.ts}", async () => {
      const result = await buildFixture(fixture, {
        cleanPaths: [".xmcp"],
      });
      expect(
        result.exitCode,
        `${mode} build failed:\n${result.stderrChunks.join("")}\n${result.stdoutChunks.join("")}`
      ).toBe(0);

      const xmcpDir = path.join(fixturePath(fixture), ".xmcp");

      // Mode-specific runtime entry. If the file name changes, the user's
      // adapter wiring breaks silently — pin it.
      await expect(
        fs.access(path.join(xmcpDir, `adapter-${mode}.js`))
      ).resolves.toBeUndefined();

      // The shared adapter handler module the user imports.
      await expect(
        fs.access(path.join(xmcpDir, "adapter", "index.js"))
      ).resolves.toBeUndefined();
      await expect(
        fs.access(path.join(xmcpDir, "adapter", "index.d.ts"))
      ).resolves.toBeUndefined();

      // Pin the named exports each example consumes. If these go missing,
      // user code breaks at typecheck (and at runtime).
      const handlerDts = await fs.readFile(
        path.join(xmcpDir, "adapter", "index.d.ts"),
        "utf8"
      );
      for (const name of expectExports) {
        expect(
          handlerDts,
          `expected ${mode} adapter to expose ${name}`
        ).toMatch(new RegExp(`\\b${name}\\b`));
      }
    }, 90_000);
  }
);
