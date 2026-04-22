import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { renderTerminal } from "../reporters/terminal";
import { renderJson } from "../reporters/json";
import { renderSarif } from "../reporters/sarif";
import type { AuditReport } from "../types";

const SNAPSHOTS = path.join(__dirname, "__snapshots__");

const report: AuditReport = {
  projectRoot: "/tmp/audit-fixture",
  activeConcerns: ["security", "compliance", "quality", "performance"],
  durationMs: 42,
  suppressed: 1,
  baselined: 2,
  resolvedFailOn: null,
  findings: [
    {
      ruleId: "XMCP-HANDLER-001",
      severity: "critical",
      concern: "security",
      message: "exec() argument derives from handler input — command injection",
      file: "/tmp/audit-fixture/src/tools/shell.ts",
      line: 15,
      column: 3,
      suggestion: "Use execFile with an argv array",
    },
    {
      ruleId: "XMCP-CONFIG-002",
      severity: "high",
      concern: "security",
      message:
        "HTTP transport is enabled but no xmcp auth middleware is imported in src/",
      file: "/tmp/audit-fixture/xmcp.config.ts",
      line: 4,
      column: 3,
      suggestion:
        'Import apiKeyAuthMiddleware or jwtAuthMiddleware from "xmcp", or disable this rule if auth is terminated upstream',
    },
    {
      ruleId: "XMCP-COMPLY-005",
      severity: "low",
      concern: "compliance",
      message: "package.json is missing: version",
      file: "/tmp/audit-fixture/package.json",
      line: 1,
      column: 1,
      suggestion: "Add the required fields to package.json",
    },
    {
      ruleId: "XMCP-SCHEMA-004",
      severity: "low",
      concern: "quality",
      message: 'Schema field "name" is an unbounded z.string()',
      file: "/tmp/audit-fixture/src/tools/shell.ts",
      line: 6,
      column: 3,
      suggestion: "Add .max(N) to cap input length",
    },
    {
      ruleId: "XMCP-PERF-001",
      severity: "medium",
      concern: "performance",
      message: "readFileSync() blocks the event loop in a handler",
      file: "/tmp/audit-fixture/src/tools/shell.ts",
      line: 20,
      column: 16,
      suggestion: `Use the async equivalent from "node:fs/promises"`,
    },
  ],
};

const cleanReport: AuditReport = {
  projectRoot: "/tmp/audit-fixture",
  activeConcerns: ["security", "compliance", "quality", "performance"],
  durationMs: 15,
  suppressed: 1,
  baselined: 1,
  resolvedFailOn: null,
  findings: [],
};

describe("reporters", () => {
  it("terminal output matches snapshot", () => {
    const actual = renderTerminal(report, { useColor: false });
    expectSnapshot(actual, "terminal.golden.txt");
  });

  it("terminal clean output matches snapshot", () => {
    const actual = renderTerminal(cleanReport, { useColor: false });
    expectSnapshot(actual, "terminal-clean.golden.txt");
  });

  it("json output matches snapshot", () => {
    const actual = renderJson(report, { toolVersion: "0.0.0-test" });
    expectSnapshot(actual, "json.golden.json");
    const parsed = JSON.parse(actual);
    assert.equal(parsed.schemaVersion, "1.0");
    assert.equal(parsed.summary.total, 5);
    assert.equal(parsed.summary.bySeverity.critical, 1);
    assert.equal(parsed.summary.byConcern.security, 2);
  });

  it("sarif output matches snapshot", () => {
    const actual = renderSarif(report, { toolVersion: "0.0.0-test" });
    expectSnapshot(actual, "sarif.golden.json");
    const parsed = JSON.parse(actual);
    assert.equal(parsed.version, "2.1.0");
    assert.equal(parsed.runs[0].results.length, 5);
    assert.equal(parsed.runs[0].results[0].level, "error");
    assert.ok(
      parsed.runs[0].tool.driver.rules.some(
        (r: { id: string }) => r.id === "XMCP-HANDLER-001"
      )
    );
  });
});

function expectSnapshot(actual: string, name: string): void {
  const snapshotPath = path.join(SNAPSHOTS, name);
  if (process.env.XMCP_UPDATE_SNAPSHOTS === "1") {
    fs.mkdirSync(SNAPSHOTS, { recursive: true });
    fs.writeFileSync(snapshotPath, actual);
    return;
  }
  if (!fs.existsSync(snapshotPath)) {
    fs.mkdirSync(SNAPSHOTS, { recursive: true });
    fs.writeFileSync(snapshotPath, actual);
    return;
  }
  const expected = fs.readFileSync(snapshotPath, "utf8");
  assert.equal(
    actual,
    expected,
    `snapshot ${name} mismatch. Run with XMCP_UPDATE_SNAPSHOTS=1 to update.`
  );
}
