import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { runScan } from "../scanner";
import { ALL_RULES } from "../rules";
import { ALL_CONCERNS, type Rule, type ScannerEvent } from "../types";

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
      "XMCP-SCHEMA-006",
      "XMCP-PERF-001",
      "XMCP-PERF-005",
      "XMCP-HANDLER-001",
      "XMCP-HANDLER-002",
      "XMCP-HANDLER-006",
      "XMCP-HANDLER-007",
      "XMCP-HANDLER-008",
      "XMCP-HANDLER-009",
      "XMCP-MCP-006",
      "XMCP-MCP-013",
      "XMCP-MCP-014",
      "XMCP-MCP-008",
      "XMCP-MCP-009",
      "XMCP-META-001",
      "XMCP-META-002",
      "XMCP-META-005",
      "XMCP-META-006",
      "XMCP-CONFIG-001",
      "XMCP-CONFIG-002",
      "XMCP-CONFIG-003",
      "XMCP-CONFIG-004",
      "XMCP-SUPPLY-001",
      "XMCP-COMPLY-005",
      "XMCP-RESOURCE-001",
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

describe("xmcp audit --since scope filtering", () => {
  it("drops file-scope findings outside changedFiles, keeps project-scope", async () => {
    const projectRoot = path.join(FIXTURES, "vulnerable-project");
    // Intentionally empty: no tool file is "in scope".
    const changedFiles = new Set<string>();
    const report = await runScan({
      projectRoot,
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
      changedFiles,
    });
    const ids = new Set(report.findings.map((f) => f.ruleId));

    // File-scope rules (e.g. HANDLER-001 inside tools/) must be dropped.
    assert.ok(
      !ids.has("XMCP-HANDLER-001"),
      "file-scope HANDLER-001 should be dropped when no files are in scope"
    );
    assert.ok(
      !ids.has("XMCP-SCHEMA-001"),
      "file-scope SCHEMA-001 should be dropped"
    );

    // Project-scope rules must still run against the full project.
    assert.ok(
      ids.has("XMCP-COMPLY-005"),
      "project-scope COMPLY-005 should still fire (package.json)"
    );
    assert.ok(
      ids.has("XMCP-SUPPLY-001"),
      "project-scope SUPPLY-001 should still fire (install scripts)"
    );
  });
});

describe("xmcp audit MCP-native rules", () => {
  it("fires all expected new rules on the mcp-native fixture", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "mcp-native-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
    });
    const ids = new Set(report.findings.map((f) => f.ruleId));
    const expected = [
      "XMCP-SCHEMA-005", // output schema not validated
      "XMCP-MCP-010", // elicit result action unchecked
      "XMCP-MCP-011", // resource uri not canonicalized
      "XMCP-MCP-012", // description references unknown placeholders
      "XMCP-CONFIG-005", // server info incomplete
    ];
    for (const ruleId of expected) {
      assert.ok(
        ids.has(ruleId),
        `missing ${ruleId}; got: ${[...ids].join(", ")}`
      );
    }
  });
});

describe("xmcp audit config block", () => {
  it("applies ignore globs, scoped ignores, severity overrides and failOn", async () => {
    const report = await runScan({
      projectRoot: path.join(FIXTURES, "audit-config-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
    });

    const schema001 = report.findings.filter(
      (f) => f.ruleId === "XMCP-SCHEMA-001"
    );
    assert.equal(
      schema001.length,
      1,
      `expected exactly one SCHEMA-001 (from tools/a.ts); got ${schema001
        .map((f) => f.file)
        .join(", ")}`
    );
    assert.ok(
      schema001[0].file.endsWith("/tools/a.ts"),
      `SCHEMA-001 should only come from tools/a.ts; got ${schema001[0].file}`
    );
    assert.equal(
      schema001[0].severity,
      "high",
      "severity should be bumped to high by config override"
    );

    const schema004 = report.findings.filter(
      (f) => f.ruleId === "XMCP-SCHEMA-004"
    );
    assert.equal(
      schema004.length,
      0,
      "SCHEMA-004 should be fully disabled by severity: off"
    );

    assert.equal(report.resolvedFailOn, "critical");
    assert.ok(
      report.suppressed >= 1,
      "config ignores should count as suppressed"
    );
  });
});

describe("xmcp audit execution errors", () => {
  it("turns thrown rule checks into execution-error findings", async () => {
    const rule: Rule = {
      meta: {
        id: "XMCP-TEST-EXECUTION-ERROR",
        name: "test-execution-error",
        description: "Synthetic rule failure for test coverage",
        severity: "high",
        concern: "quality",
        rationale: "Used to verify rule execution-error handling.",
        examples: {
          bad: "throw new Error('boom')",
          good: "return []",
        },
      },
      check() {
        throw new Error("boom");
      },
    };

    ALL_RULES.push(rule);
    try {
      const report = await runScan({
        projectRoot: path.join(FIXTURES, "clean-project"),
        activeConcerns: new Set(["quality"]),
        enabledRules: new Set([rule.meta.id]),
        noDeps: true,
      });

      assert.equal(report.findings.length, 1);
      assert.equal(report.findings[0].ruleId, rule.meta.id);
      assert.equal(report.findings[0].severity, "info");
      assert.equal(report.findings[0].metadata?.executionError, true);
    } finally {
      ALL_RULES.pop();
    }
  });

  it("emits findings identically through the event-emission path", async () => {
    const batch = await runScan({
      projectRoot: path.join(FIXTURES, "vulnerable-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
    });

    const events: ScannerEvent[] = [];
    const live = await runScan({
      projectRoot: path.join(FIXTURES, "vulnerable-project"),
      activeConcerns: new Set(ALL_CONCERNS),
      noDeps: true,
      onEvent: (e) => events.push(e),
    });

    const batchIds = [...batch.findings]
      .map((f) => `${f.ruleId}|${f.file}|${f.line ?? 0}`)
      .sort();
    const liveIds = [...live.findings]
      .map((f) => `${f.ruleId}|${f.file}|${f.line ?? 0}`)
      .sort();
    assert.deepEqual(
      liveIds,
      batchIds,
      "event-emission path should produce the same findings as the batch path"
    );

    const firstEvent = events[0];
    const lastEvent = events[events.length - 1];
    assert.equal(firstEvent.type, "scan:start");
    assert.equal(lastEvent.type, "scan:complete");

    const findingEvents = events.filter((e) => e.type === "finding");
    assert.equal(
      findingEvents.length,
      live.findings.length,
      "one finding event per emitted finding"
    );

    const ruleStarts = events.filter((e) => e.type === "rule:start");
    const ruleCompletes = events.filter((e) => e.type === "rule:complete");
    assert.equal(
      ruleStarts.length,
      ruleCompletes.length,
      "every rule:start has a matching rule:complete"
    );
    // Total indexing is contiguous.
    ruleStarts.forEach((e, i) => {
      if (e.type !== "rule:start") return;
      assert.equal(e.index, i);
    });
  });

  it("emits deps:skipped when --no-deps is set", async () => {
    const events: ScannerEvent[] = [];
    await runScan({
      projectRoot: path.join(FIXTURES, "clean-project"),
      activeConcerns: new Set(["security"]),
      noDeps: true,
      onEvent: (e) => events.push(e),
    });

    const depsSkipped = events.find((e) => e.type === "deps:skipped");
    assert.ok(depsSkipped, "deps:skipped should fire when noDeps is true");
    if (depsSkipped?.type === "deps:skipped") {
      assert.equal(depsSkipped.reason, "disabled");
    }
  });

  it("escalates thrown rule checks in strict execution mode", async () => {
    const rule: Rule = {
      meta: {
        id: "XMCP-TEST-STRICT-EXECUTION-ERROR",
        name: "test-strict-execution-error",
        description: "Synthetic strict rule failure for test coverage",
        severity: "high",
        concern: "quality",
        rationale: "Used to verify strict execution-error handling.",
        examples: {
          bad: "throw new Error('boom')",
          good: "return []",
        },
      },
      check() {
        throw new Error("boom");
      },
    };

    ALL_RULES.push(rule);
    try {
      const report = await runScan({
        projectRoot: path.join(FIXTURES, "clean-project"),
        activeConcerns: new Set(["quality"]),
        enabledRules: new Set([rule.meta.id]),
        noDeps: true,
        strictExecutionErrors: true,
      });

      assert.equal(report.findings.length, 1);
      assert.equal(report.findings[0].ruleId, rule.meta.id);
      assert.equal(report.findings[0].severity, "high");
      assert.equal(report.findings[0].metadata?.executionError, true);
    } finally {
      ALL_RULES.pop();
    }
  });
});
