import assert from "node:assert/strict";
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, afterEach, beforeEach, test } from "node:test";

import callPaperTool from "../src/tools/call-paper-tool";
import listPaperTools from "../src/tools/list-paper-tools";

const directory = mkdtempSync(join(tmpdir(), "xmcp-paper-"));
const command = join(directory, "paper.cjs");
const originalEnv = { ...process.env };
writeFileSync(
  command,
  `#!/usr/bin/env node
const readline = require("node:readline");
function send(id, result) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\\n"); }
readline.createInterface({ input: process.stdin }).on("line", line => {
  const message = JSON.parse(line);
  if (message.method === "initialize") {
    send(message.id, { protocolVersion: message.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: "fake-paper", version: "1" }, instructions: JSON.stringify({ pid: process.pid }) });
  } else if (message.method === "tools/list") {
    const second = message.params?.cursor === "next";
    send(message.id, { tools: [{ name: second ? "write" : "read", inputSchema: { type: "object", properties: { value: { type: "string" } } } }], ...(second ? {} : { nextCursor: "next" }) });
  } else if (message.method === "tools/call") {
    send(message.id, { isError: message.params.arguments.fail === true, content: [{ type: "text", text: JSON.stringify({ ...message.params, pid: process.pid }) }, { type: "image", mimeType: "image/png", data: "cGl4ZWw=" }], structuredContent: { forwarded: true } });
  } else if (message.id !== undefined) {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } }) + "\\n");
  }
});
`
);
chmodSync(command, 0o755);
beforeEach(() => {
  process.env.PAPER_COMMAND = command;
  process.env.PAPER_ALLOWED_TOOLS = "read";
});
afterEach(() => {
  process.env = { ...originalEnv };
});
after(() => rmSync(directory, { recursive: true, force: true }));

function assertExited(pid: number) {
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
}

test("discovery follows pagination and returns schemas, instructions, and policy", async () => {
  const result = await listPaperTools();
  const data = JSON.parse(result.content[0].text);
  assert.deepEqual(
    data.tools.map((tool: { name: string; allowed: boolean }) => [
      tool.name,
      tool.allowed,
    ]),
    [
      ["read", true],
      ["write", false],
    ]
  );
  assert.equal(data.tools[0].inputSchema.properties.value.type, "string");
  assertExited(JSON.parse(data.instructions).pid);
});

test("allowed calls preserve errors, images, structured content, and close the CLI", async () => {
  for (const fail of [false, true]) {
    const result = await callPaperTool({
      name: "read",
      arguments: { value: "hello", fail },
    });
    assert.equal(result.isError, fail);
    assert.deepEqual(result.structuredContent, { forwarded: true });
    assert.equal(result.content[1].type, "image");
    const content = result.content[0];
    assert.equal(content.type, "text");
    if (content.type !== "text") throw new Error("Expected text");
    const data = JSON.parse(content.text);
    assert.deepEqual(data.arguments, { value: "hello", fail });
    assertExited(data.pid);
  }
});

test("direct denied calls never launch Paper, including with an empty allowlist", async () => {
  delete process.env.PAPER_COMMAND;
  assert.equal(
    (await callPaperTool({ name: "write", arguments: {} })).isError,
    true
  );
  process.env.PAPER_ALLOWED_TOOLS = "";
  assert.equal(
    (await callPaperTool({ name: "read", arguments: {} })).isError,
    true
  );
});

test("the executable is server configured and must be an absolute path", async () => {
  process.env.PAPER_COMMAND = "paper";
  await assert.rejects(listPaperTools(), /absolute CLI path/);
});
