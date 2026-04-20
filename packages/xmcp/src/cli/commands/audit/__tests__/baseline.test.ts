import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  DEFAULT_BASELINE_PATH,
  fingerprintFinding,
  loadBaseline,
  partitionByBaseline,
  writeBaseline,
} from "../baseline";
import type { Finding } from "../types";

function tempProjectRoot(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-audit-baseline-"));
}

const findings: Finding[] = [
  {
    ruleId: "XMCP-SCHEMA-001",
    severity: "medium",
    concern: "quality",
    message: "z.any() in tool schema disables input validation",
    file: "/project/src/tools/a.ts",
    line: 5,
    column: 3,
  },
  {
    ruleId: "XMCP-SCHEMA-001",
    severity: "medium",
    concern: "quality",
    message: "z.any() in tool schema disables input validation",
    file: "/project/src/tools/b.ts",
    line: 7,
    column: 3,
  },
];

describe("audit baseline", () => {
  it("roundtrips: write, load, partition recognizes prior findings", () => {
    const projectRoot = "/project";
    const tmp = tempProjectRoot();
    const target = path.join(tmp, DEFAULT_BASELINE_PATH);

    writeBaseline(target, findings, projectRoot, "0.0.0-test");

    const loaded = loadBaseline(target);
    assert.ok(loaded, "baseline should load");
    assert.equal(loaded.entries.length, 2);

    const { fresh, baselined } = partitionByBaseline(
      findings,
      loaded,
      projectRoot
    );
    assert.equal(fresh.length, 0, "all findings should be baselined");
    assert.equal(baselined.length, 2);
  });

  it("treats new findings as fresh", () => {
    const projectRoot = "/project";
    const loaded = {
      schemaVersion: "1",
      toolVersion: "0.0.0-test",
      generatedAt: new Date().toISOString(),
      entries: [
        {
          ruleId: "XMCP-SCHEMA-001",
          file: "src/tools/a.ts",
          fingerprint: fingerprintFinding(findings[0], projectRoot),
        },
      ],
    };

    const { fresh, baselined } = partitionByBaseline(
      findings,
      loaded,
      projectRoot
    );
    assert.equal(baselined.length, 1, "existing finding recognized");
    assert.equal(fresh.length, 1, "new finding surfaced");
    assert.equal(fresh[0].file, "/project/src/tools/b.ts");
  });

  it("returns null for a missing baseline file", () => {
    const tmp = tempProjectRoot();
    const result = loadBaseline(path.join(tmp, "does-not-exist.json"));
    assert.equal(result, null);
  });

  it("fingerprint is stable across line-number shifts in the message", () => {
    const projectRoot = "/project";
    const base = { ...findings[0], message: "violation at line :5 here" };
    const shifted = { ...findings[0], message: "violation at line :42 here" };
    assert.equal(
      fingerprintFinding(base, projectRoot),
      fingerprintFinding(shifted, projectRoot),
      "line numbers embedded in message should be stripped from the hash"
    );
  });
});
