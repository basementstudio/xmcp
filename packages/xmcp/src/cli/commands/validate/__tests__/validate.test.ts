import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { beforeEach, afterEach, describe, it } from "node:test";
import { runValidate } from "../index";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function writeFile(dir: string, relativePath: string, content: string): void {
  const fullPath = path.join(dir, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

const VALID_TOOL = `import { z } from "zod";
import { type ToolMetadata, type InferSchema } from "xmcp";

export const schema = {
  name: z.string().describe("The name"),
};

export const metadata: ToolMetadata = {
  name: "my-tool",
  description: "Does something useful",
};

export default function myTool(params: InferSchema<typeof schema>) {
  return "hello";
}
`;

const VALID_RESOURCE = `import { type ResourceMetadata } from "xmcp";

export const metadata: ResourceMetadata = {
  name: "my-resource",
  description: "Provides data",
};

export default function myResource() {
  return "data";
}
`;

const VALID_PROMPT = `import { type PromptMetadata } from "xmcp";

export const metadata: PromptMetadata = {
  name: "my-prompt",
  title: "My Prompt",
  description: "A prompt",
};

export default function myPrompt() {
  return "prompt text";
}
`;

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("xmcp validate command", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-validate-"));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  it("reports no issues for a valid tool file", async () => {
    writeFile(tempDir, "src/tools/my-tool.ts", VALID_TOOL);

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 1);
    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues.length, 0);
  });

  it("reports no issues for valid resource and prompt files", async () => {
    writeFile(tempDir, "src/resources/my-resource.ts", VALID_RESOURCE);
    writeFile(tempDir, "src/prompts/my-prompt.ts", VALID_PROMPT);

    const summary = await runValidate({
      tools: undefined,
      prompts: "src/prompts",
      resources: "src/resources",
    });

    assert.equal(summary.fileCount, 2);
    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
  });

  // -------------------------------------------------------------------------
  // Error: missing export default
  // -------------------------------------------------------------------------

  it("reports error for tool missing export default", async () => {
    writeFile(
      tempDir,
      "src/tools/no-default.ts",
      `export const metadata = { name: "no-default", description: "A tool" };
export const schema = {};
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 1);
    assert.equal(summary.totalWarnings, 0);

    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues.length, 1);
    assert.equal(result.issues[0]?.kind, "missing-default-export");
    assert.equal(result.issues[0]?.severity, "error");
  });

  // -------------------------------------------------------------------------
  // Error: missing export const metadata
  // -------------------------------------------------------------------------

  it("reports error for tool missing export const metadata", async () => {
    writeFile(
      tempDir,
      "src/tools/no-metadata.ts",
      `export const schema = {};
export default function noMetadata() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 1);

    const result = summary.results[0];
    assert.ok(result);
    const kinds = result.issues.map((i) => i.kind);
    assert.ok(kinds.includes("missing-metadata-export"));
  });

  // -------------------------------------------------------------------------
  // Warning: missing export const schema (tools only)
  // -------------------------------------------------------------------------

  it("reports warning for tool missing export const schema", async () => {
    writeFile(
      tempDir,
      "src/tools/no-schema.ts",
      `export const metadata = { name: "no-schema", description: "A tool" };
export default function noSchema() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 1);

    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues[0]?.kind, "missing-schema-export");
    assert.equal(result.issues[0]?.severity, "warning");
  });

  it("does not warn about missing schema for resource files", async () => {
    writeFile(tempDir, "src/resources/no-schema.ts", VALID_RESOURCE);

    const summary = await runValidate({
      tools: undefined,
      prompts: undefined,
      resources: "src/resources",
    });

    assert.equal(summary.totalWarnings, 0);
    assert.equal(summary.totalErrors, 0);
  });

  it("does not warn about missing schema for prompt files", async () => {
    writeFile(tempDir, "src/prompts/no-schema.ts", VALID_PROMPT);

    const summary = await runValidate({
      tools: undefined,
      prompts: "src/prompts",
      resources: undefined,
    });

    assert.equal(summary.totalWarnings, 0);
    assert.equal(summary.totalErrors, 0);
  });

  // -------------------------------------------------------------------------
  // Warning: placeholder description
  // -------------------------------------------------------------------------

  it("reports warning for placeholder description when metadata is present", async () => {
    writeFile(
      tempDir,
      "src/tools/placeholder.ts",
      `export const schema = {};
export const metadata = { name: "placeholder", description: "TODO: Add description" };
export default function placeholder() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 1);

    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues[0]?.kind, "placeholder-description");
  });

  it("does not warn about placeholder description when metadata export is missing", async () => {
    writeFile(
      tempDir,
      "src/tools/no-meta-placeholder.ts",
      `export const schema = {};
export default function noMeta() { return "hi"; }
// description: "TODO: Add description"
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    const result = summary.results[0];
    assert.ok(result);
    const kinds = result.issues.map((i) => i.kind);
    assert.ok(!kinds.includes("placeholder-description"));
    assert.ok(kinds.includes("missing-metadata-export"));
  });

  // -------------------------------------------------------------------------
  // Multiple issues in one file
  // -------------------------------------------------------------------------

  it("reports multiple issues for a file missing both metadata and default export", async () => {
    writeFile(
      tempDir,
      "src/tools/broken.ts",
      `export const schema = {};
// intentionally missing metadata and default export
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 2);

    const result = summary.results[0];
    assert.ok(result);
    const kinds = result.issues.map((i) => i.kind);
    assert.ok(kinds.includes("missing-metadata-export"));
    assert.ok(kinds.includes("missing-default-export"));
  });

  // -------------------------------------------------------------------------
  // Non-existent directory
  // -------------------------------------------------------------------------

  it("skips gracefully when directory does not exist", async () => {
    const summary = await runValidate({
      tools: "src/tools-nonexistent",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 0);
    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
  });

  // -------------------------------------------------------------------------
  // Nested paths
  // -------------------------------------------------------------------------

  it("scans and validates files in nested subdirectories", async () => {
    writeFile(tempDir, "src/tools/api/users/get-user.ts", VALID_TOOL);

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 1);
    assert.equal(summary.totalErrors, 0);

    const result = summary.results[0];
    assert.ok(result);
    assert.match(result.filePath, /get-user\.ts/);
  });

  // -------------------------------------------------------------------------
  // Multiple files — correct counts
  // -------------------------------------------------------------------------

  it("correctly counts errors and warnings across multiple files", async () => {
    // 1 valid file
    writeFile(tempDir, "src/tools/good.ts", VALID_TOOL);

    // 1 file with 1 error
    writeFile(
      tempDir,
      "src/tools/no-default.ts",
      `export const metadata = { name: "bad", description: "bad" };
export const schema = {};
`
    );

    // 1 file with 1 warning
    writeFile(
      tempDir,
      "src/tools/placeholder.ts",
      `export const schema = {};
export const metadata = { name: "placeholder", description: "TODO: Add description" };
export default function placeholder() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 3);
    assert.equal(summary.totalErrors, 1);
    assert.equal(summary.totalWarnings, 1);
  });

  // -------------------------------------------------------------------------
  // Custom paths via options override config
  // -------------------------------------------------------------------------

  it("respects custom directory override via options", async () => {
    writeFile(tempDir, "lib/my-tools/greet.ts", VALID_TOOL);

    const summary = await runValidate({
      tools: "lib/my-tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 1);
    assert.equal(summary.totalErrors, 0);
  });

  // -------------------------------------------------------------------------
  // Config-derived paths from xmcp.config.json
  // -------------------------------------------------------------------------

  it("uses paths from xmcp.config.json when no CLI overrides given", async () => {
    // Write a config that sets a custom tools dir
    fs.writeFileSync(
      path.join(tempDir, "xmcp.config.json"),
      JSON.stringify({ paths: { tools: "custom/tools", prompts: false, resources: false } })
    );

    writeFile(tempDir, "custom/tools/my-tool.ts", VALID_TOOL);

    const summary = await runValidate({
      tools: undefined,
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 1);
    assert.equal(summary.totalErrors, 0);
    const result = summary.results[0];
    assert.ok(result);
    assert.match(result.filePath, /custom\/tools/);
  });

  // -------------------------------------------------------------------------
  // .tsx files are included
  // -------------------------------------------------------------------------

  it("includes .tsx widget files in the scan", async () => {
    writeFile(
      tempDir,
      "src/tools/widget.tsx",
      `import { type ToolMetadata } from "xmcp";
import { useState } from "react";

export const metadata: ToolMetadata = {
  name: "widget",
  description: "A widget",
};

export const schema = {};

export default function widget() {
  return <div>hi</div>;
}
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 1);
    assert.equal(summary.totalErrors, 0);
  });

  // -------------------------------------------------------------------------
  // Null dir (explicitly disabled path in config)
  // -------------------------------------------------------------------------

  it("silently skips a directory disabled in xmcp.config.json (null path)", async () => {
    fs.writeFileSync(
      path.join(tempDir, "xmcp.config.json"),
      JSON.stringify({ paths: { tools: false, prompts: false, resources: false } })
    );

    // No files written — nothing to scan
    const summary = await runValidate({
      tools: undefined,
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 0);
    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
  });

  // -------------------------------------------------------------------------
  // Empty directory (exists but contains no .ts/.tsx files)
  // -------------------------------------------------------------------------

  it("reports no files when directory exists but has no .ts/.tsx files", async () => {
    fs.mkdirSync(path.join(tempDir, "src", "tools"), { recursive: true });
    fs.writeFileSync(path.join(tempDir, "src", "tools", "readme.md"), "# tools");

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.fileCount, 0);
    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
  });

  // -------------------------------------------------------------------------
  // Placeholder description applies to resource and prompt types too
  // -------------------------------------------------------------------------

  it("reports placeholder warning for resource with placeholder description", async () => {
    writeFile(
      tempDir,
      "src/resources/placeholder.ts",
      `export const metadata = { name: "placeholder", description: "TODO: Add description" };
export default function placeholder() { return "data"; }
`
    );

    const summary = await runValidate({
      tools: undefined,
      prompts: undefined,
      resources: "src/resources",
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 1);
    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues[0]?.kind, "placeholder-description");
  });

  it("reports placeholder warning for prompt with placeholder description", async () => {
    writeFile(
      tempDir,
      "src/prompts/placeholder.ts",
      `export const metadata = { name: "placeholder", description: "TODO: Add description" };
export default function placeholder() { return "prompt text"; }
`
    );

    const summary = await runValidate({
      tools: undefined,
      prompts: "src/prompts",
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 1);
    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues[0]?.kind, "placeholder-description");
  });

  // -------------------------------------------------------------------------
  // Regex word-boundary — no false positives on similar export names
  // -------------------------------------------------------------------------

  it("does not false-positive on export const metadataFoo or schemaFoo", async () => {
    writeFile(
      tempDir,
      "src/tools/boundary.ts",
      `export const metadataFoo = {};
export const schemaFoo = {};
export const metadata = { name: "boundary", description: "real" };
export const schema = {};
export default function boundary() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 0);
  });

  // -------------------------------------------------------------------------
  // All three directories scanned together
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // Grammar: "has issues" vs "have issues" (subject-verb agreement)
  // -------------------------------------------------------------------------

  it("prints 'has issues' (not 'have issues') when exactly one file has issues", async () => {
    writeFile(
      tempDir,
      "src/tools/broken.ts",
      `export const schema = {};
// intentionally missing metadata and default export
`
    );

    const logs: string[] = [];
    const original = console.log;
    console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));

    try {
      await runValidate({
        tools: "src/tools",
        prompts: undefined,
        resources: undefined,
      });
    } finally {
      console.log = original;
    }

    const summaryLine = logs.find((l) => l.includes("of 1 file"));
    assert.ok(summaryLine, "expected a summary line containing 'of 1 file'");
    assert.match(summaryLine, /has issues/, `expected "has issues" but got: ${summaryLine}`);
  });

  // -------------------------------------------------------------------------
  // Placeholder regex: single-quoted description string
  // -------------------------------------------------------------------------

  it("detects placeholder description wrapped in single quotes", async () => {
    writeFile(
      tempDir,
      "src/tools/single-quote.ts",
      `export const metadata = { name: "test", description: 'TODO: Add description' };
export const schema = {};
export default function test() { return "hi"; }
`
    );

    const summary = await runValidate({
      tools: "src/tools",
      prompts: undefined,
      resources: undefined,
    });

    assert.equal(summary.totalErrors, 0);
    assert.equal(summary.totalWarnings, 1);
    const result = summary.results[0];
    assert.ok(result);
    assert.equal(result.issues[0]?.kind, "placeholder-description");
    assert.equal(result.issues[0]?.severity, "warning");
  });

  // -------------------------------------------------------------------------
  // All three directories scanned together
  // -------------------------------------------------------------------------

  it("scans tools, resources, and prompts together and counts issues across all", async () => {
    writeFile(tempDir, "src/tools/good-tool.ts", VALID_TOOL);
    writeFile(
      tempDir,
      "src/tools/bad-tool.ts",
      `export const schema = {};
export const metadata = { name: "bad", description: "TODO: Add description" };
export default function badTool() { return "hi"; }
`
    );
    writeFile(tempDir, "src/resources/good-resource.ts", VALID_RESOURCE);
    writeFile(
      tempDir,
      "src/resources/bad-resource.ts",
      `export const metadata = { name: "bad-resource", description: "ok" };
` // missing default export
    );
    writeFile(tempDir, "src/prompts/good-prompt.ts", VALID_PROMPT);

    const summary = await runValidate({
      tools: "src/tools",
      prompts: "src/prompts",
      resources: "src/resources",
    });

    assert.equal(summary.fileCount, 5);
    assert.equal(summary.totalErrors, 1);   // bad-resource missing default
    assert.equal(summary.totalWarnings, 1); // bad-tool placeholder description

    const fileTypes = summary.results.map((r) => r.fileType);
    assert.ok(fileTypes.includes("tool"));
    assert.ok(fileTypes.includes("resource"));
    assert.ok(fileTypes.includes("prompt"));
  });
});
