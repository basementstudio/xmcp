import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { beforeEach, afterEach, describe, it } from "node:test";

function runCli(args: string[], cwd: string) {
  return spawnSync(
    "node",
    [path.join(process.cwd(), "dist/index.js"), ...args],
    {
      cwd,
      encoding: "utf8",
      env: { ...process.env, XMCP_CLI_TEST_MODE: "1" },
    }
  );
}

function writeClientsFile(dir: string, contents: string) {
  const clientsPath = path.join(dir, "clients.ts");
  fs.writeFileSync(clientsPath, contents, "utf8");
  return clientsPath;
}

function readGeneratedFile(dir: string, name: string) {
  const filePath = path.join(dir, "src/generated", name);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
}

describe("xmcp-dev/cli generate", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-cli-"));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("errors when no clients.ts is present", () => {
    const result = runCli(["generate"], tempDir);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /No clients found/);
  });

  it("generates from clients.ts (http entry)", () => {
    writeClientsFile(
      tempDir,
      `export const clients = {
        remote: { url: "http://localhost:3001/mcp" }
      };`
    );

    const result = runCli(["generate"], tempDir);

    assert.equal(result.status, 0);
    const index = readGeneratedFile(tempDir, "client.index.ts");
    const client = readGeneratedFile(tempDir, "client.remote.ts");
    assert.match(index, /generatedClients/);
    assert.match(client, /clientRemote/);
  });
});
