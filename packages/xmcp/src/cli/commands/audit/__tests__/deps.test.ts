import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  runDepsAudit,
  mapNpmOutput,
  mapPnpmOutput,
  mapYarnOutput,
} from "../deps";
import type { ScanContext } from "../types";

describe("deps adapters", () => {
  it("maps npm audit --json output into advisories", () => {
    const stdout = JSON.stringify({
      vulnerabilities: {
        "semver-regex": {
          severity: "high",
          range: "<3.1.4",
          via: [
            {
              source: 1234,
              title: "Inefficient Regular Expression Complexity",
              url: "https://github.com/advisories/GHSA-xxxx",
              range: "<3.1.4",
              cwe: ["CWE-1333"],
            },
          ],
          fixAvailable: { name: "semver-regex", version: "3.1.4" },
        },
      },
    });
    const advisories = mapNpmOutput(stdout);
    assert.equal(advisories.length, 1);
    const [a] = advisories;
    assert.equal(a.package, "semver-regex");
    assert.equal(a.severity, "high");
    assert.match(a.title, /Regular Expression/);
    assert.equal(a.fixAvailable, "semver-regex@3.1.4");
  });

  it("maps pnpm audit --json output into advisories", () => {
    const stdout = JSON.stringify({
      advisories: {
        "1": {
          module_name: "lodash",
          title: "Prototype pollution",
          url: "https://example.com",
          severity: "moderate",
          vulnerable_versions: "<4.17.21",
          patched_versions: ">=4.17.21",
          cves: ["CVE-2020-8203"],
        },
      },
    });
    const advisories = mapPnpmOutput(stdout);
    assert.equal(advisories.length, 1);
    assert.equal(advisories[0].severity, "medium");
    assert.equal(advisories[0].package, "lodash");
    assert.deepEqual(advisories[0].cves, ["CVE-2020-8203"]);
  });

  it("maps yarn npm audit --json output (NDJSON) into advisories", () => {
    const stdout = [
      JSON.stringify({
        type: "auditAdvisory",
        data: {
          advisory: {
            module_name: "minimist",
            title: "Prototype pollution",
            url: "https://example.com",
            severity: "critical",
            cves: ["CVE-2020-7598"],
            vulnerable_versions: "<1.2.6",
            patched_versions: ">=1.2.6",
          },
        },
      }),
      JSON.stringify({ type: "auditSummary", data: {} }),
    ].join("\n");
    const advisories = mapYarnOutput(stdout);
    assert.equal(advisories.length, 1);
    assert.equal(advisories[0].severity, "critical");
    assert.equal(advisories[0].package, "minimist");
  });

  it("returns empty on malformed json", () => {
    assert.deepEqual(mapNpmOutput("not json"), []);
    assert.deepEqual(mapPnpmOutput("not json"), []);
    assert.deepEqual(mapYarnOutput("not json\n"), []);
  });

  it("returns an execution-error finding when the audit subprocess cannot start", async () => {
    const findings = await runDepsAudit({
      projectRoot: "/path/that/does/not/exist",
      xmcpConfigPresent: false,
      xmcpConfigFile: null,
      toolsDir: null,
      promptsDir: null,
      resourcesDir: null,
      tools: [],
      prompts: [],
      resources: [],
      allSourceFiles: [],
      packageJson: null,
      packageJsonPath: null,
      packageManager: "pnpm",
      gitignoreContent: null,
      suppressions: new Map(),
      auditConfig: {
        ignore: [],
        severity: {},
        failOn: null,
      },
      changedFiles: null,
      activeConcerns: new Set(["security"]),
      noDeps: false,
      strictExecutionErrors: true,
    } satisfies ScanContext);

    assert.equal(findings.length, 1);
    assert.equal(findings[0].ruleId, "XMCP-DEPS-001");
    assert.equal(findings[0].severity, "high");
    assert.equal(findings[0].metadata?.executionError, true);
  });
});
