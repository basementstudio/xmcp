import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runAudit } from "../index";

const PACKAGE_ROOT = path.join(__dirname, "../../../../..");
const CLI_PATH = path.join(PACKAGE_ROOT, "src/cli.ts");
const FIXTURES = path.join(__dirname, "fixtures");

function tempFile(name: string): string {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-audit-command-")),
    name
  );
}

describe("audit command behavior", () => {
  it("ci mode forces failOn=high even when config sets a higher threshold", async () => {
    const output = tempFile("audit.json");
    const result = await runAudit({
      path: path.join(FIXTURES, "audit-config-project"),
      format: "json",
      noDeps: true,
      ci: true,
      output,
    });

    assert.equal(result.exitCode, 1);
  });

  it("noHeuristics excludes heuristic findings from the report", async () => {
    const output = tempFile("audit.json");
    const result = await runAudit({
      path: path.join(FIXTURES, "mcp-native-project"),
      format: "json",
      noDeps: true,
      noHeuristics: true,
      output,
    });

    assert.equal(result.exitCode, 0);
    const payload = JSON.parse(fs.readFileSync(output, "utf8"));
    const ruleIds = new Set(
      payload.findings.map((finding: { ruleId: string }) => finding.ruleId)
    );
    assert.ok(!ruleIds.has("XMCP-MCP-010"));
    assert.ok(!ruleIds.has("XMCP-SCHEMA-005"));
    assert.ok(ruleIds.has("XMCP-CONFIG-005"));
  });

  it("rejects unknown rule ids", async () => {
    const output = tempFile("audit.json");
    const result = await runAudit({
      path: path.join(FIXTURES, "clean-project"),
      format: "json",
      noDeps: true,
      disableRule: ["XMCP-NOT-A-RULE"],
      output,
    });

    assert.equal(result.exitCode, 2);
  });
});

describe("source cli smoke", () => {
  it("lists audit rules without loading compiler-only globals", () => {
    const stdout = execFileSync(
      "node",
      ["--import", "tsx", CLI_PATH, "audit:list-rules", "--format", "json"],
      {
        cwd: PACKAGE_ROOT,
        encoding: "utf8",
      }
    );
    const payload = JSON.parse(stdout);
    assert.ok(payload.rules.length > 0);
  });

  it("fails build preflight before bundling on audit findings", () => {
    const fixtureRoot = path.join(FIXTURES, "vulnerable-project");
    const result = spawnSync(
      "pnpm",
      ["exec", "node", "--import", "tsx", CLI_PATH, "build", "--audit"],
      {
        cwd: fixtureRoot,
        encoding: "utf8",
      }
    );

    assert.equal(result.status, 1);
    assert.match(result.stdout, /Building for production/);
    assert.match(result.stdout, /finding|No findings/);
  });
});
