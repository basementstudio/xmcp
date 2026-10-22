import assert from "node:assert/strict";
import { test } from "node:test";
import { describeCode } from "./code-language.ts";

test("uses filename and fence metadata before inference", () => {
  assert.deepEqual(
    describeCode({ title: "src/middleware.ts", source: "const value = 1" }),
    { label: "TypeScript", badge: "TS" }
  );
  assert.equal(
    describeCode({
      language: "tsx",
      source: "export default function App() {}",
    }).label,
    "TSX"
  );
  assert.equal(describeCode({ language: "json", source: "{}" }).label, "JSON");
  assert.equal(
    describeCode({ language: "bash", source: "echo hello" }).label,
    "Shell"
  );
  assert.equal(describeCode({ title: ".env.local" }).label, "Environment");
});

test("recognizes unlabelled commands, URLs, JSON and clear code signatures", () => {
  for (const [source, label] of [
    ["pnpm add xmcp", "Shell"],
    ["https://xmcp.dev/mcp", "URL"],
    ["mcp.inbound.new/mcp", "URL"],
    ['{"name":"xmcp"}', "JSON"],
    ["export interface Tool { name: string }", "TypeScript"],
    ["const value = 1;", "JavaScript"],
    ["SELECT name FROM tools", "SQL"],
    ["import os", "Python"],
    ["<!doctype html>", "HTML"],
  ])
    assert.equal(describeCode({ source }).label, label, source);
});

test("does not invent filenames or classify ambiguous text", () => {
  assert.deepEqual(describeCode({ source: "Hello world" }), {
    label: "Code",
    badge: "</>",
  });
  assert.equal(describeCode({ source: "{not valid JSON}" }).label, "Code");
  assert.equal(
    describeCode({ language: "text", source: "some output" }).label,
    "Text"
  );
  assert.equal(
    describeCode({ language: "rust", source: "fn main() {}" }).label,
    "rust"
  );
  assert.equal(describeCode({ source: "" }).label, "Code");
});
