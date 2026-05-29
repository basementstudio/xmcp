import { test } from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { findMissingDefaultExports } from "../check-default-exports";

function setup() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "xmcp-default-exports-"));
  function write(name: string, content: string) {
    fs.writeFileSync(path.join(dir, name), content);
  }
  function cleanup() {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return { dir, write, cleanup };
}

test("file with export default function is not flagged", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("tool.ts", `export default function handler() { return "ok"; }`);
    const result = findMissingDefaultExports(new Set(["tool.ts"]), dir);
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});

test("file with export default async function is not flagged", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("tool.ts", `export default async function handler() { return "ok"; }`);
    const result = findMissingDefaultExports(new Set(["tool.ts"]), dir);
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});

test("file with export default class is not flagged", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("tool.ts", `export default class MyTool {}`);
    const result = findMissingDefaultExports(new Set(["tool.ts"]), dir);
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});

test("file without export default is flagged", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("tool.ts", `export const metadata = { name: "tool" };\n`);
    const result = findMissingDefaultExports(new Set(["tool.ts"]), dir);
    assert.deepStrictEqual(result, ["tool.ts"]);
  } finally {
    cleanup();
  }
});

test("only files missing export default are returned in a mixed set", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("good.ts", `export default function handler() {}`);
    write("bad.ts", `export const metadata = { name: "bad" };\n`);
    const result = findMissingDefaultExports(
      new Set(["good.ts", "bad.ts"]),
      dir
    );
    assert.deepStrictEqual(result, ["bad.ts"]);
  } finally {
    cleanup();
  }
});

test(".tsx file with export default is not flagged", () => {
  const { dir, write, cleanup } = setup();
  try {
    write("widget.tsx", `export default function Widget() { return null; }`);
    const result = findMissingDefaultExports(new Set(["widget.tsx"]), dir);
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});

test("unreadable file is silently skipped", () => {
  const { dir, cleanup } = setup();
  try {
    const result = findMissingDefaultExports(
      new Set(["nonexistent.ts"]),
      dir
    );
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});

test("empty set returns empty array", () => {
  const { dir, cleanup } = setup();
  try {
    const result = findMissingDefaultExports(new Set(), dir);
    assert.deepStrictEqual(result, []);
  } finally {
    cleanup();
  }
});
