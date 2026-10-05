import assert from "node:assert/strict";
import { test } from "node:test";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { createClient, withClient, type ClientHandlers } from "../managed";
import type { StdioClientDefinition } from "../types";

// Bound subprocess failures so a broken handshake cannot hang the unit suite.
const CONNECT_TIMEOUT_MS = 5_000;
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
    if (capabilities.elicitation) results.elicitation = await request("elicitation/create", {
      mode: "form", message: "Confirm?", requestedSchema: { type: "object", properties: {} }
    });
    if (capabilities.roots) results.roots = await request("roots/list", {});
    process.stderr.write(JSON.stringify({ pid: process.pid, capabilities, results }) + "\\n");
    if (process.argv[1] === "hang") return;
    send({ id: message.id, result: {
      protocolVersion: process.argv[1] === "fail" ? "unsupported" : message.params.protocolVersion,
      capabilities: {}, serverInfo: { name: "managed-test", version: "1" }
    } });
  }
});
`;

function fixture(mode = "success") {
  let stderr = "";
  const definition: StdioClientDefinition = {
    type: "stdio",
    name: "unit",
    command: process.execPath,
    args: ["-e", SERVER, mode],
  };
  return {
    definition,
    options: {
      versionNegotiation: { mode: "legacy" as const },
      connect: { timeout: CONNECT_TIMEOUT_MS },
      onStderrData: (chunk: Buffer) => {
        stderr += chunk.toString();
      },
    },
    observation: () => JSON.parse(stderr.trim()),
  };
}

function assertExited(pid: number) {
  assert.throws(() => process.kill(pid, 0), { code: "ESRCH" });
}

test("failed connect awaits subprocess cleanup before rejecting", async () => {
  const server = fixture("fail");
  await assert.rejects(
    createClient(server.definition, server.options),
    /not supported/
  );
  assertExited(server.observation().pid);
});

test("explicitly piped stderr is forwarded when no callback is supplied", async (context) => {
  const server = fixture();
  let stderr = "";
  context.mock.method(process.stderr, "write", (chunk: Buffer) => {
    stderr += chunk.toString();
    return true;
  });
  const { onStderrData: _onStderrData, ...options } = server.options;
  await withClient({ ...server.definition, stderr: "pipe" }, () => {}, options);
  const observation = JSON.parse(stderr.trim());
  assert.deepEqual(observation.capabilities, {});
  assertExited(observation.pid);
});

test("no handlers advertises no optional capabilities and close reaps the process", async () => {
  const server = fixture();
  const client = await createClient(server.definition, server.options);
  await Promise.all([client.close(), client.close()]);
  assert.deepEqual(server.observation().capabilities, {});
  assertExited(server.observation().pid);
});

test("handlers work during connect and advertise only their configured capability", async () => {
  const expected = {
    sampling: {
      role: "assistant" as const,
      model: "test",
      content: { type: "text" as const, text: "sample" },
    },
    elicitation: { action: "accept" as const, content: {} },
    roots: { roots: [{ uri: "file:///workspace", name: "Workspace" }] },
  };
  const handlers: ClientHandlers = {
    sampling: () => expected.sampling,
    elicitation: () => expected.elicitation,
    roots: () => expected.roots,
  };
  for (const name of ["sampling", "elicitation", "roots"] as const) {
    const server = fixture();
    await withClient(server.definition, () => {}, {
      ...server.options,
      handlers: { [name]: handlers[name] },
    });
    const { capabilities, results } = server.observation();
    assert.deepEqual(Object.keys(capabilities), [name]);
    assert.deepEqual(results[name], expected[name]);
    assertExited(server.observation().pid);
  }
});

test("aborting connection setup also awaits subprocess cleanup", async () => {
  const server = fixture("hang");
  const controller = new AbortController();
  await assert.rejects(
    createClient(server.definition, {
      ...server.options,
      connect: { ...server.options.connect, signal: controller.signal },
      onStderrData: (chunk) => {
        server.options.onStderrData(chunk);
        controller.abort(new Error("cancel connect"));
      },
    }),
    /cancel connect/
  );
  assertExited(server.observation().pid);
});

test("withClient returns the callback value and closes after callback failure", async () => {
  const success = fixture();
  assert.equal(
    await withClient(success.definition, () => 42, success.options),
    42
  );
  assertExited(success.observation().pid);
  const failure = fixture();
  const error = new Error("operation failed");
  await assert.rejects(
    withClient(
      failure.definition,
      () => {
        throw error;
      },
      failure.options
    ),
    (candidate) => candidate === error
  );
  assertExited(failure.observation().pid);
});

test("aborting an HTTP discovery probe closes the connection", async (context) => {
  const controller = new AbortController();
  const sockets = new Set<import("node:net").Socket>();
  const server = createServer(async (request) => {
    for await (const _chunk of request) {
      /* consume the probe */
    }
    controller.abort(new Error("cancel discovery"));
  });
  server.on("connection", (socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  context.after(() => {
    server.closeAllConnections();
    server.close();
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  await assert.rejects(
    createClient(
      {
        type: "http",
        name: "unit",
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/mcp`,
      },
      { connect: { timeout: CONNECT_TIMEOUT_MS, signal: controller.signal } }
    ),
    /cancel discovery/
  );
  await Promise.all(
    [...sockets].map((socket) =>
      once(socket, "close", { signal: AbortSignal.timeout(CONNECT_TIMEOUT_MS) })
    )
  );
});
