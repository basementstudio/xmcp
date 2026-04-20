import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { runScan } from "../scanner";
import { ALL_CONCERNS } from "../types";

const FIXTURES = path.join(__dirname, "fixtures");

describe("xmcp audit scanner", () => {
  it("produces no findings on the clean fixture", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "clean-project"),
      activeConcerns: new Set(ALL_CONCERNS),
    });
    assert.equal(
      report.findings.length,
      0,
      `expected 0 findings, got: ${report.findings.map((f) => f.ruleId).join(", ")}`
    );
  });

  it("flags expected rules on the vulnerable fixture", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "vulnerable-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
    });
    const ids = new Set(report.findings.map((f) => f.ruleId));
    const expected = [
      "XMCP-SECRET-001",
      "XMCP-SECRET-002",
      "XMCP-SCHEMA-001",
      "XMCP-SCHEMA-004",
      "XMCP-PERF-001",
      "XMCP-HANDLER-001",
      "XMCP-HANDLER-002",
      "XMCP-META-001",
      "XMCP-META-002",
      "XMCP-CONFIG-001",
      "XMCP-CONFIG-002",
      "XMCP-CONFIG-003",
      "XMCP-CONFIG-004",
      "XMCP-SUPPLY-001",
      "XMCP-COMPLY-005",
    ];
    for (const ruleId of expected) {
      assert.ok(
        ids.has(ruleId),
        `missing ${ruleId}; got: ${[...ids].join(", ")}`
      );
    }
  });

  it("respects --concern filter", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "vulnerable-project"),
      activeConcerns: new Set(["quality"]),
      noDeps: true,
    });
    const concerns = new Set(report.findings.map((f) => f.concern));
    assert.deepEqual([...concerns].sort(), ["quality"]);
  });

  it("honors inline xmcp-audit-ignore directives", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "suppression-project"),
      activeConcerns: new Set(ALL_CONCERNS),
    });
    const schemaFindings = report.findings.filter(
      (f) => f.ruleId === "XMCP-SCHEMA-001"
    );
    assert.equal(
      schemaFindings.length,
      0,
      "schema finding should be suppressed"
    );
    assert.ok(report.suppressed >= 1, "suppressed count should be >= 1");
  });

  it("respects --disable-rule", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "vulnerable-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      disabledRules: new Set(["XMCP-SECRET-001"]),
      noDeps: true,
    });
    const ids = report.findings.map((f) => f.ruleId);
    assert.ok(!ids.includes("XMCP-SECRET-001"));
  });
});
