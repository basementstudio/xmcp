import { test } from "node:test";
import assert from "node:assert";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hasPostCSSConfig } from "../config-detection";

test("hasPostCSSConfig - returns false when no config files exist", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    const result = hasPostCSSConfig();
    assert.strictEqual(result, false);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when postcss.config.js exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "postcss.config.js"), "module.exports = {}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when postcss.config.mjs exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "postcss.config.mjs"), "export default {}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when postcss.config.cjs exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "postcss.config.cjs"), "module.exports = {}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when .postcssrc exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, ".postcssrc"), "{}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when .postcssrc.json exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, ".postcssrc.json"), "{}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when .postcssrc.js exists", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, ".postcssrc.js"), "module.exports = {}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns true when multiple config files exist", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "postcss.config.js"), "module.exports = {}");
    writeFileSync(join(testDir, ".postcssrc.json"), "{}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, true);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns false with non-postcss config files", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "package.json"), "{}");
    writeFileSync(join(testDir, "tsconfig.json"), "{}");
    writeFileSync(join(testDir, "tailwind.config.js"), "{}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, false);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});

test("hasPostCSSConfig - returns false with similar but incorrect filenames", () => {
  const testDir = mkdtempSync(join(tmpdir(), "xmcp-test-"));
  const originalCwd = process.cwd();

  try {
    process.chdir(testDir);
    writeFileSync(join(testDir, "postcss.js"), "{}");
    writeFileSync(join(testDir, "postcss-config.js"), "{}");
    writeFileSync(join(testDir, ".postcss"), "{}");
    const result = hasPostCSSConfig();
    assert.strictEqual(result, false);
  } finally {
    process.chdir(originalCwd);
    rmSync(testDir, { recursive: true, force: true });
  }
});
