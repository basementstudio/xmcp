import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const CLI_ENTRY = path.join(PACKAGE_ROOT, "dist", "index.js");

function runCli(
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv = {}
) {
  return spawnSync("node", [CLI_ENTRY, ...args], {
    cwd,
    encoding: "utf8",
    env: { ...process.env, XMCP_CLI_TEST_MODE: "1", ...env },
  });
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

    expect(result.status).not.toBe(0);
    expect(result.stderr).toMatch(/No clients found/);
  });

  it("generates from clients.ts (http entry)", () => {
    writeClientsFile(
      tempDir,
      `export const clients = {
        remote: { url: "http://localhost:3001/mcp" }
      };`
    );

    const result = runCli(["generate"], tempDir);

    expect(result.status).toBe(0);
    const index = readGeneratedFile(tempDir, "client.index.ts");
    const client = readGeneratedFile(tempDir, "client.remote.ts");
    expect(index).toMatch(/generatedClients/);
    expect(client).toMatch(/clientRemote/);
  });

  it("continues generating other clients when one fetch fails", () => {
    writeClientsFile(
      tempDir,
      `export const clients = {
        bad: { url: "http://localhost:3001/mcp" },
        good: { url: "http://localhost:3002/mcp" }
      };`
    );

    const result = runCli(["generate"], tempDir, {
      XMCP_CLI_TEST_FAIL_CLIENTS: "bad",
    });

    expect(result.status).toBe(0);
    const index = readGeneratedFile(tempDir, "client.index.ts");
    const badClient = readGeneratedFile(tempDir, "client.bad.ts");
    const goodClient = readGeneratedFile(tempDir, "client.good.ts");

    expect(badClient).toBe("");
    expect(goodClient).not.toBe("");
    expect(index).toMatch(/clientGood/);
    expect(index).not.toContain("clientBad");
  });
});
