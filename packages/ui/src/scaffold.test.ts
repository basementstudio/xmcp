import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initUi } from "./scaffold.js";

const tempDirs: string[] = [];

function createProject() {
  const dir = mkdtempSync(path.join(tmpdir(), "xmcp-ui-init-"));
  tempDirs.push(dir);
  writeFileSync(
    path.join(dir, "package.json"),
    JSON.stringify({ name: "demo", version: "0.0.0" }, null, 2)
  );
  return dir;
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const dir = tempDirs.pop();
    if (dir) {
      rmSync(dir, { recursive: true, force: true });
    }
  }
});

describe("initUi", () => {
  it("writes starter files and missing dependencies", () => {
    const cwd = createProject();

    const changed = initUi({ cwd });

    expect(changed).toContain("package.json");
    expect(changed).toContain("src/globals.css");
    expect(changed).toContain("src/tools/render-json.tsx");
    expect(changed).toContain("src/tools/ui-kit-demo.tsx");

    const packageJson = JSON.parse(
      readFileSync(path.join(cwd, "package.json"), "utf8")
    );
    expect(packageJson.dependencies["@xmcp-dev/ui"]).toBe("latest");
    expect(packageJson.dependencies.xmcp).toBe("latest");
    expect(packageJson.devDependencies.tailwindcss).toBe("^4.1.18");
  });

  it("does not write files during a dry run", () => {
    const cwd = createProject();

    const changed = initUi({ cwd, dryRun: true });

    expect(changed).toContain("package.json");
    expect(changed).toContain("src/globals.css");
    expect(() =>
      readFileSync(path.join(cwd, "src/globals.css"), "utf8")
    ).toThrow();
  });

  it("refuses to overwrite existing starter files without force", () => {
    const cwd = createProject();
    initUi({ cwd });

    expect(() => initUi({ cwd })).toThrow(
      "Refusing to overwrite existing files"
    );
  });
});
