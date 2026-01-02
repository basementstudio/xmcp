import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert";
import path from "path";
import fs from "fs-extra";
import os from "os";
import { updateTsConfig } from "../helpers/update-tsconfig.js";

describe("updateTsConfig", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-tsconfig-"));
  });

  afterEach(() => {
    fs.removeSync(tempDir);
  });

  it("merges alias without removing existing config", () => {
    const tsconfigPath = path.join(tempDir, "tsconfig.json");
    fs.writeJsonSync(
      tsconfigPath,
      {
        compilerOptions: {
          strict: true,
          paths: {
            "@app/*": ["./src/*"],
          },
        },
        include: ["src"],
        exclude: ["dist"],
      },
      { spaces: 2 }
    );

    updateTsConfig(tempDir);

    const updated = fs.readJsonSync(tsconfigPath);

    assert.strictEqual(updated.compilerOptions.strict, true);
    assert.deepStrictEqual(updated.compilerOptions.paths["@app/*"], ["./src/*"]);
    assert.deepStrictEqual(updated.compilerOptions.paths["@xmcp/*"], ["./.xmcp/*"]);
    assert.deepStrictEqual(updated.exclude, ["dist"]);
    assert.ok(updated.include.includes("src"));
    assert.ok(updated.include.includes("xmcp-env.d.ts"));
  });

  it("creates compilerOptions and paths when missing", () => {
    const tsconfigPath = path.join(tempDir, "tsconfig.json");
    fs.writeJsonSync(tsconfigPath, { include: ["src"] }, { spaces: 2 });

    updateTsConfig(tempDir);

    const updated = fs.readJsonSync(tsconfigPath);

    assert.deepStrictEqual(updated.compilerOptions.paths["@xmcp/*"], ["./.xmcp/*"]);
    assert.ok(updated.include.includes("xmcp-env.d.ts"));
  });
});

