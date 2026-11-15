import assert from "node:assert/strict";
import { test } from "node:test";
import { createSTDIOClient } from "../index";

// A legacy server that answers the server/discover probe with "method not
// found", then reports the capabilities it received and exercises each one.
const SERVER = `
const readline = require("node:readline");
const pending = new Map();
function send(message) { process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\\n"); }
function request(method, params) {
  return new Promise(resolve => { pending.set(method, resolve); send({ id: method, method, params }); });
}
readline.createInterface({ input: process.stdin }).on("line", async line => {
  const message = JSON.parse(line);
  if (pending.has(message.id)) {
    pending.get(message.id)(message.result ?? message.error);
    pending.delete(message.id);
  } else if (message.method === "initialize") {
    const capabilities = message.params.capabilities;
    const results = {};
    if (capabilities.sampling) results.sampling = await request("sampling/createMessage", { messages: [], maxTokens: 1 });
    process.stderr.write(JSON.stringify({ capabilities, results }) + "\\n");
    send({ id: message.id, result: {
      protocolVersion: message.params.protocolVersion,
      capabilities: {}, serverInfo: { name: "factory-test", version: "1" }
    } });
  } else if (message.id !== undefined) {
    send({ id: message.id, error: { code: -32601, message: "Method not found" } });
  }
});
`;

async function connect(
  handlers?: Parameters<typeof createSTDIOClient>[0]["handlers"]
) {
  let stderr = "";
  const { client } = await createSTDIOClient({
    command: process.execPath,
    args: ["-e", SERVER],
    handlers,
    onStderrData: (chunk) => {
      stderr += chunk.toString();
    },
  });
  await client.close();
  return JSON.parse(stderr.trim());
}

test("createSTDIOClient advertises no optional capabilities without handlers", async () => {
  const { capabilities } = await connect();
  assert.deepEqual(capabilities, {});
});

test("createSTDIOClient advertises and serves only configured handlers", async () => {
  const sample = {
    role: "assistant" as const,
    model: "test",
    content: { type: "text" as const, text: "sample" },
  };
  const { capabilities, results } = await connect({ sampling: () => sample });
  assert.deepEqual(capabilities, { sampling: {} });
  assert.deepEqual(results.sampling, sample);
});
