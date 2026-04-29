import { describe, it, expect, beforeAll } from "vitest";
import path from "node:path";
import { existsSync } from "node:fs";
import { buildFixture, snapshotFileTree } from "./_utils";

describe("compile() — fixture builds", () => {
  describe("basic-tools", () => {
    let result: Awaited<ReturnType<typeof buildFixture>>;

    beforeAll(async () => {
      result = await buildFixture("basic-tools");
    }, 60_000);

    it("exits 0", () => {
      expect(result.exitCode).toBe(0);
    });

    it("emits dist/stdio.js and dist/http.js", () => {
      expect(existsSync(path.join(result.distDir, "stdio.js"))).toBe(true);
      expect(existsSync(path.join(result.distDir, "http.js"))).toBe(true);
    });

    it("registers the echo tool", () => {
      const stdout = result.stdoutChunks.join("");
      expect(stdout).toMatch(/Registered 1 tool/);
    });

    it("dist/ tree matches snapshot", async () => {
      const tree = await snapshotFileTree(result.distDir);
      expect(tree).toMatchSnapshot();
    });
  });

  describe("empty-paths", () => {
    let result: Awaited<ReturnType<typeof buildFixture>>;

    beforeAll(async () => {
      result = await buildFixture("empty-paths");
    }, 60_000);

    it("exits 0 with no source files", () => {
      expect(result.exitCode).toBe(0);
    });

    it("still emits stdio.js and http.js", () => {
      expect(existsSync(path.join(result.distDir, "stdio.js"))).toBe(true);
      expect(existsSync(path.join(result.distDir, "http.js"))).toBe(true);
    });

    it("reports no tools/prompts/resources registered", () => {
      const stdout = result.stdoutChunks.join("");
      expect(stdout).toMatch(/No tools, prompts, or resources registered/);
    });

    it("dist/ tree matches snapshot", async () => {
      const tree = await snapshotFileTree(result.distDir);
      expect(tree).toMatchSnapshot();
    });
  });

  describe("custom-paths", () => {
    let result: Awaited<ReturnType<typeof buildFixture>>;

    beforeAll(async () => {
      result = await buildFixture("custom-paths");
    }, 60_000);

    it("exits 0", () => {
      expect(result.exitCode).toBe(0);
    });

    it("emits stdio.js when only stdio is configured", () => {
      expect(existsSync(path.join(result.distDir, "stdio.js"))).toBe(true);
    });

    it("does not emit http.js when http is disabled", () => {
      expect(existsSync(path.join(result.distDir, "http.js"))).toBe(false);
    });

    it("registers the tool from the custom lib/tools path", () => {
      const stdout = result.stdoutChunks.join("");
      expect(stdout).toMatch(/Registered 1 tool/);
    });

    it("dist/ tree matches snapshot", async () => {
      const tree = await snapshotFileTree(result.distDir);
      expect(tree).toMatchSnapshot();
    });
  });
});
