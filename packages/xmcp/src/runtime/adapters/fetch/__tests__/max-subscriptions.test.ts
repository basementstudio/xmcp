import assert from "node:assert/strict";
import { before, test } from "node:test";

// Separate process from fetch.test.ts because the handler captures config at import.
Object.assign(globalThis, {
  HTTP_CONFIG: { maxSubscriptions: 1 },
  SERVER_INFO: { name: "subscription-test", version: "1.0.0" },
  INJECTED_TOOLS: {
    "src/tools/ping.ts": async () => ({
      metadata: {
        name: "ping",
        description: "Keep tool-list subscriptions meaningful",
      },
      schema: {},
      default: () => "pong",
    }),
  },
  INJECTED_PROMPTS: {},
  INJECTED_RESOURCES: {},
  INJECTED_MIDDLEWARE: undefined,
});

let xmcpHandler: typeof import("../index").xmcpHandler;
before(async () => {
  ({ xmcpHandler } = await import("../index"));
});

function request(method: string) {
  return new Request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-protocol-version": "2026-07-28",
      "mcp-method": method,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": "2026-07-28",
          "io.modelcontextprotocol/clientCapabilities": {},
          "io.modelcontextprotocol/clientInfo": {
            name: "subscription-client",
            version: "1",
          },
        },
        ...(method === "subscriptions/listen"
          ? { notifications: { toolsListChanged: true } }
          : {}),
      },
    }),
  });
}

// Guards against accidentally awaiting the end of a long-lived response.
const TEST_TIMEOUT_MS = 5_000;

test(
  "Fetch adapter enforces a positive cap, keeps lists available, and releases canceled streams",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    const responses: Response[] = [];
    context.after(async () => {
      for (const response of responses) {
        if (!response.bodyUsed) await response.body?.cancel();
      }
    });
    const call = async (method: string) => {
      const response = await xmcpHandler(request(method));
      responses.push(response);
      return response;
    };
    const first = await call("subscriptions/listen");
    assert.match(first.headers.get("content-type") ?? "", /text\/event-stream/);
    const second = await call("subscriptions/listen");
    assert.equal(second.status, 200);
    assert.doesNotMatch(
      second.headers.get("content-type") ?? "",
      /text\/event-stream/
    );
    assert.equal(
      (await second.json()).error.message,
      "Subscription limit reached"
    );

    const listed = await call("tools/list");
    assert.equal(listed.status, 200);
    assert.equal((await listed.json()).result.tools[0].name, "ping");

    await first.body!.cancel();
    const replacement = await call("subscriptions/listen");
    assert.match(
      replacement.headers.get("content-type") ?? "",
      /text\/event-stream/
    );
    await replacement.body!.cancel();
  }
);
