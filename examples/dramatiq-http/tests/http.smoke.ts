import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { decode, rpc, startServer, TEST_TIMEOUT_MS } from "./server";

const KEY = "client-test-key";

const BRIDGE_TOKEN = "bridge-test-token";

const JOB_ID = "5f0f8a52-8a8e-4bd4-9a0e-1f6f3c3ef0a7";

test(
  "xmcp tools talk to the bridge with auth and surface its states",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    // Stands in for the Python bridge and records what xmcp sends.
    const requests: string[] = [];
    let available = true;
    const upstream = createServer((request, response) => {
      requests.push(
        `${request.method} ${request.url} ${request.headers.authorization}`
      );
      const reply = (status: number, body: unknown) => {
        response.writeHead(status, { "content-type": "application/json" });
        response.end(JSON.stringify(body));
      };
      if (!available) return reply(503, { detail: "Redis down: secret" });
      if (request.method === "POST") return reply(202, { jobId: JOB_ID });
      reply(200, { status: "unavailable" });
    }).listen(0, "127.0.0.1");
    await once(upstream, "listening");
    context.after(() => upstream.close());
    const { port } = upstream.address() as AddressInfo;

    const endpoint = await startServer(context, {
      MCP_API_KEY: KEY,
      DRAMATIQ_BRIDGE_URL: `http://127.0.0.1:${port}`,
      DRAMATIQ_BRIDGE_TOKEN: BRIDGE_TOKEN,
    });
    const send = rpc(endpoint, AbortSignal.timeout(TEST_TIMEOUT_MS));
    const call = async (name: string, args: unknown) =>
      decode(await send("tools/call", { name, arguments: args }, KEY));

    const [allowed, denied] = await Promise.all([
      send("tools/list", {}, KEY),
      send("tools/list", {}, "wrong"),
    ]);
    assert.equal(denied.status, 401);
    assert.equal((await send("tools/list", {})).status, 401);
    const names = (await decode(allowed)).result.tools.map(
      (tool: { name: string }) => tool.name
    );
    assert.deepEqual(names.sort(), ["enqueue-word-count", "get-job-result"]);

    const enqueued = await call("enqueue-word-count", { text: "one two" });
    assert.deepEqual(JSON.parse(enqueued.result.content[0].text), {
      jobId: JOB_ID,
    });
    const result = await call("get-job-result", { jobId: JOB_ID });
    assert.deepEqual(JSON.parse(result.result.content[0].text), {
      status: "unavailable",
    });
    assert.deepEqual(requests, [
      `POST /v1/jobs Bearer ${BRIDGE_TOKEN}`,
      `GET /v1/jobs/${JOB_ID} Bearer ${BRIDGE_TOKEN}`,
    ]);

    const invalid = await call("get-job-result", { jobId: "not-a-uuid" });
    assert.ok(invalid.error || invalid.result?.isError);
    assert.equal(requests.length, 2);

    available = false;
    const outage = await call("enqueue-word-count", { text: "one" });
    assert.equal(outage.result.isError, true);
    assert.match(outage.result.content[0].text, /HTTP 503/);
    assert.doesNotMatch(outage.result.content[0].text, /secret/);
    assert.equal(requests.length, 3);
  }
);
