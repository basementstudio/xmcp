import { describe, it, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "fs-extra";
import { updateTsConfig } from "../../src/helpers/update-tsconfig.js";

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

    expect(updated.compilerOptions.strict).toBe(true);
    expect(updated.compilerOptions.paths["@app/*"]).toEqual(["./src/*"]);
    expect(updated.compilerOptions.paths["@xmcp/*"]).toEqual(["./.xmcp/*"]);
    expect(updated.exclude).toEqual(["dist"]);
    expect(updated.include).toContain("src");
    expect(updated.include).toContain("xmcp-env.d.ts");
  });

  it("creates compilerOptions and paths when missing", () => {
    const tsconfigPath = path.join(tempDir, "tsconfig.json");
    fs.writeJsonSync(tsconfigPath, { include: ["src"] }, { spaces: 2 });

    updateTsConfig(tempDir);

    const updated = fs.readJsonSync(tsconfigPath);

    expect(updated.compilerOptions.paths["@xmcp/*"]).toEqual(["./.xmcp/*"]);
    expect(updated.include).toContain("xmcp-env.d.ts");
  });
});
