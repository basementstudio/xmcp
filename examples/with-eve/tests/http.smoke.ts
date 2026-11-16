import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { test } from "node:test";
import { decode, rpc, startServer, TEST_TIMEOUT_MS } from "./server";

const KEY = "client-test-key";

const AGENT_TOKEN = "agent-test-token";

test(
  "xmcp serves eve: auth, discovery, tools, and agent failures",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    // Stands in for a failing eve deployment and counts submissions.
    const submissions: string[] = [];
    const upstream = createServer((request, response) => {
      submissions.push(`${request.method} ${request.headers.authorization}`);
      response.writeHead(500, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "model exploded: secret-detail" }));
    }).listen(0, "127.0.0.1");
    await once(upstream, "listening");
    context.after(() => upstream.close());
    const { port } = upstream.address() as AddressInfo;

    const endpoint = await startServer(context, {
      MCP_API_KEY: KEY,
      EVE_URL: `http://127.0.0.1:${port}`,
      EVE_TOKEN: AGENT_TOKEN,
    });
    const send = rpc(endpoint, AbortSignal.timeout(TEST_TIMEOUT_MS));
    const call = async (name: string, args: unknown) =>
      decode(await send("tools/call", { name, arguments: args }, KEY));

    assert.equal((await send("tools/list", {})).status, 401);
    assert.equal((await send("tools/list", {}, "wrong")).status, 401);

    const [allowed, denied] = await Promise.all([
      send("tools/list", {}, KEY),
      send("tools/list", {}, "wrong"),
    ]);
    assert.equal(denied.status, 401);
    const names = (await decode(allowed)).result.tools.map(
      (tool: { name: string }) => tool.name
    );
    assert.deepEqual(names.sort(), ["ask-agent", "get-shipping-policy"]);

    const policy = await call("get-shipping-policy", {});
    assert.match(policy.result.content[0].text, /3–5 business days/);

    const invalid = await call("ask-agent", { prompt: "" });
    assert.ok(invalid.error || invalid.result?.isError);
    assert.equal(submissions.length, 0);

    const failed = await call("ask-agent", { prompt: "How long is shipping?" });
    assert.equal(failed.result.isError, true);
    assert.match(failed.result.content[0].text, /eve agent request failed/);
    assert.doesNotMatch(failed.result.content[0].text, /secret-detail/);
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0], `POST Bearer ${AGENT_TOKEN}`);

    // The agent's connection only allows the read-only tool.
    process.env.MCP_URL = endpoint;
    process.env.MCP_API_KEY = KEY;
    const { default: connection } = await import("../agent/connections/xmcp");
    assert.deepEqual(connection.tools, { allow: ["get-shipping-policy"] });
  }
);
