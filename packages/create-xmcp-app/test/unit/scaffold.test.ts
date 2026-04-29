import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const CLI_ENTRY = path.join(PACKAGE_ROOT, "index.js");

function runCxa(args: string[], cwd: string) {
  return spawnSync("node", [CLI_ENTRY, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env },
  });
}

function listFilesSorted(rootDir: string): string[] {
  const entries = fs.readdirSync(rootDir, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((e) => e.isFile())
    .map((e) =>
      path
        .relative(rootDir, path.join(e.parentPath ?? e.path, e.name))
        .split(path.sep)
        .join("/")
    )
    .sort();
}

describe("create-xmcp-app — scaffold", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cxa-test-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("scaffolds the default typescript template non-interactively", () => {
    const result = runCxa(
      ["my-app", "--yes", "--skip-install", "--use-npm", "--http"],
      tempDir
    );

    expect(
      result.status,
      `cxa failed:\nstdout: ${result.stdout}\nstderr: ${result.stderr}`
    ).toBe(0);

    const projectDir = path.join(tempDir, "my-app");
    expect(fs.existsSync(projectDir)).toBe(true);

    const pkgJson = JSON.parse(
      fs.readFileSync(path.join(projectDir, "package.json"), "utf8")
    );
    expect(pkgJson.name).toBe("my-app");
    // The scaffold pins the `xmcp` dep to the create-xmcp-app version.
    expect(pkgJson.dependencies?.xmcp).toBeTruthy();
  });

  it("emits the expected file tree (snapshot) for the default template", () => {
    const result = runCxa(
      ["my-app", "--yes", "--skip-install", "--use-npm", "--http"],
      tempDir
    );
    expect(result.status).toBe(0);

    // Snapshot the project tree so silent additions/removals to the default
    // typescript template are surfaced. Update with `pnpm test -u`.
    const tree = listFilesSorted(path.join(tempDir, "my-app"));
    expect(tree).toMatchSnapshot();
  });

  it("refuses to scaffold into a non-empty directory", () => {
    const conflictDir = path.join(tempDir, "occupied");
    fs.mkdirSync(conflictDir);
    fs.writeFileSync(path.join(conflictDir, "README.md"), "hi");

    const result = runCxa(
      ["occupied", "--yes", "--skip-install", "--use-npm", "--http"],
      tempDir
    );

    expect(result.status).not.toBe(0);
    expect(result.stderr + result.stdout).toMatch(/not empty/i);
  });
});
