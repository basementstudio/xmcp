import assert from "node:assert/strict";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { test } from "node:test";
import { createFixture } from "../fixture.js";

test("rejects fixture files outside the project or inside linked dependencies", async () => {
  for (const path of [
    "",
    ".",
    "..",
    "../outside.ts",
    "src/../../outside.ts",
    join(tmpdir(), "xmcp-outside.ts"),
    "node_modules/fixture-only/probe.ts",
    "src/../node_modules/fixture-only/probe.ts",
  ]) {
    await assert.rejects(
      createFixture({
        kind: "http",
        moduleType: "module",
        files: { [path]: "" },
      }),
      /Fixture file must stay inside the project and outside node_modules/
    );
  }
});
