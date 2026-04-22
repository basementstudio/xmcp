import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { createLiveReporter } from "../reporters/terminal-live";
import type { AuditReport, Finding, ScannerEvent } from "../types";

const STRIP_ANSI = /\[[0-9;]*m/g;

function makeStream(): { stream: NodeJS.WriteStream; text: () => string } {
  const chunks: string[] = [];
  const writable = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(chunk.toString());
      callback();
    },
  }) as unknown as NodeJS.WriteStream;
  // log-update uses isTTY/columns; in test mode we pretend it's a plain stream.
  Object.assign(writable, { isTTY: false, columns: 120, rows: 40 });
  return {
    stream: writable,
    text: () => chunks.join("").replace(STRIP_ANSI, ""),
  };
}

const PROJECT_ROOT = "/tmp/audit-fixture";

const criticalFinding: Finding = {
  ruleId: "XMCP-HANDLER-001",
  severity: "critical",
  concern: "security",
  message: "exec() argument derives from handler input — command injection",
  file: `${PROJECT_ROOT}/src/tools/shell.ts`,
  line: 15,
  column: 3,
  suggestion: "Use execFile with an argv array",
};

const lowFinding: Finding = {
  ruleId: "XMCP-SCHEMA-004",
  severity: "low",
  concern: "quality",
  message: 'Schema field "name" is an unbounded z.string()',
  file: `${PROJECT_ROOT}/src/tools/shell.ts`,
  line: 6,
  column: 3,
  suggestion: "Add .max(N) to cap input length",
};

function play(
  reporter: ReturnType<typeof createLiveReporter>,
  events: ScannerEvent[]
): void {
  for (const e of events) reporter.handleEvent(e);
}

describe("createLiveReporter", () => {
  it("renders a full live run with findings", () => {
    const { stream, text } = makeStream();
    const reporter = createLiveReporter({
      projectRoot: PROJECT_ROOT,
      out: stream,
    });

    play(reporter, [
      {
        type: "scan:start",
        totalRules: 2,
        files: 3,
        concerns: ["security", "quality"],
        startedAt: Date.now(),
      },
      {
        type: "rule:start",
        ruleId: "XMCP-HANDLER-001",
        concern: "security",
        index: 0,
        total: 2,
      },
      { type: "finding", finding: criticalFinding, ruleId: "XMCP-HANDLER-001" },
      {
        type: "rule:complete",
        ruleId: "XMCP-HANDLER-001",
        concern: "security",
        index: 0,
        total: 2,
        findingsInRule: 1,
        durationMs: 5,
      },
      {
        type: "rule:start",
        ruleId: "XMCP-SCHEMA-004",
        concern: "quality",
        index: 1,
        total: 2,
      },
      { type: "finding", finding: lowFinding, ruleId: "XMCP-SCHEMA-004" },
      {
        type: "rule:complete",
        ruleId: "XMCP-SCHEMA-004",
        concern: "quality",
        index: 1,
        total: 2,
        findingsInRule: 1,
        durationMs: 3,
      },
      { type: "deps:skipped", reason: "disabled" },
      { type: "scan:complete", durationMs: 9, totalFindings: 2 },
    ]);

    const finalReport: AuditReport = {
      projectRoot: PROJECT_ROOT,
      activeConcerns: ["security", "quality"],
      durationMs: 9,
      suppressed: 0,
      baselined: 0,
      resolvedFailOn: null,
      findings: [criticalFinding, lowFinding],
    };
    reporter.finish(finalReport);

    const out = text();
    assert.ok(out.includes("XMCP"), "should include the xmcp logo");
    assert.ok(out.includes("Audit"), "should include the audit header");
    assert.ok(
      out.includes("src/tools/shell.ts"),
      "should include the relative file path"
    );
    assert.ok(
      out.includes(criticalFinding.message),
      "should include the critical finding message"
    );
    assert.ok(
      out.includes(lowFinding.message),
      "should include the low finding message"
    );
    assert.ok(
      out.includes("XMCP-HANDLER-001:15:3"),
      "should render the location suffix"
    );
    assert.ok(
      out.includes(criticalFinding.suggestion!),
      "should render the suggestion"
    );
    assert.ok(out.includes("2 findings"), "summary should count findings");
    assert.ok(out.includes("1 critical"), "summary should count critical");
    assert.ok(out.includes("1 low"), "summary should count low");
  });

  it("renders a clean summary when no findings arrive", () => {
    const { stream, text } = makeStream();
    const reporter = createLiveReporter({
      projectRoot: PROJECT_ROOT,
      out: stream,
    });

    play(reporter, [
      {
        type: "scan:start",
        totalRules: 1,
        files: 0,
        concerns: ["security"],
        startedAt: Date.now(),
      },
      {
        type: "rule:start",
        ruleId: "XMCP-DEMO",
        concern: "security",
        index: 0,
        total: 1,
      },
      {
        type: "rule:complete",
        ruleId: "XMCP-DEMO",
        concern: "security",
        index: 0,
        total: 1,
        findingsInRule: 0,
        durationMs: 1,
      },
      { type: "scan:complete", durationMs: 2, totalFindings: 0 },
    ]);

    reporter.finish({
      projectRoot: PROJECT_ROOT,
      activeConcerns: ["security"],
      durationMs: 2,
      suppressed: 0,
      baselined: 0,
      resolvedFailOn: null,
      findings: [],
    });

    const out = text();
    assert.ok(out.includes("No findings."), "should show clean summary");
    assert.ok(!out.includes("critical"), "should not mention critical");
  });

  it("includes hidden counts in the final summary", () => {
    const { stream, text } = makeStream();
    const reporter = createLiveReporter({
      projectRoot: PROJECT_ROOT,
      out: stream,
    });

    play(reporter, [
      {
        type: "scan:start",
        totalRules: 1,
        files: 0,
        concerns: ["security"],
        startedAt: Date.now(),
      },
      { type: "finding", finding: criticalFinding, ruleId: "XMCP-HANDLER-001" },
      { type: "scan:complete", durationMs: 1, totalFindings: 1 },
    ]);

    reporter.finish({
      projectRoot: PROJECT_ROOT,
      activeConcerns: ["security"],
      durationMs: 1,
      suppressed: 2,
      baselined: 3,
      resolvedFailOn: null,
      findings: [criticalFinding],
    });

    const out = text();
    assert.ok(out.includes("2 suppressed"), "summary shows suppressed count");
    assert.ok(out.includes("3 baselined"), "summary shows baselined count");
  });
});
