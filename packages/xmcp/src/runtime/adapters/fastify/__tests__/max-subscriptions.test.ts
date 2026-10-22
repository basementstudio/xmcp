import assert from "node:assert";
import { before, describe, it } from "node:test";

import Fastify from "fastify";

// Bound regressions that accidentally leave a subscription stream open.
const TEST_TIMEOUT_MS = 5_000;

// A separate file from fastify.test.ts because HTTP_CONFIG is captured when the
// adapter module is evaluated: the two suites need different values for it, and
// the test runner gives each file its own process.
const g = globalThis as Record<string, unknown>;
g["HTTP_CONFIG"] = {
  port: 3001,
  host: "127.0.0.1",
  bodySizeLimit: 10 * 1024 * 1024,
  endpoint: "/mcp",
  maxSubscriptions: 0,
  debug: false,
};
g["HTTP_CORS_CONFIG"] = {
  origin: "*",
  methods: ["GET", "POST"],
  credentials: false,
  maxAge: 86400,
};
g["INJECTED_MIDDLEWARE"] = undefined;
g["INJECTED_TOOLS"] = {};
g["INJECTED_PROMPTS"] = {};
g["INJECTED_RESOURCES"] = {};
g["SERVER_INFO"] = { name: "test-server", version: "0.0.0" };

const HEADERS = {
  "content-type": "application/json",
  accept: "text/event-stream, application/json",
};
const MODERN_META = {
  "io.modelcontextprotocol/protocolVersion": "2026-07-28",
  "io.modelcontextprotocol/clientCapabilities": {},
  "io.modelcontextprotocol/clientInfo": {
    name: "modern-test",
    version: "1.0.0",
  },
};

describe("http.maxSubscriptions", () => {
  let xmcpHandler!: (req: any, reply: any) => Promise<void>;

  before(async () => {
    ({ xmcpHandler } = (await import("../index")) as {
      xmcpHandler: typeof xmcpHandler;
    });
  });

  it(
    "refuses subscriptions/listen in band when the cap is 0",
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const app = Fastify({ forceCloseConnections: true });
      const controller = new AbortController();
      context.after(async () => {
        controller.abort();
        await app.close();
      });
      app.post("/mcp", xmcpHandler);
      const address = await app.listen({ host: "127.0.0.1", port: 0 });
      // Real fetch exposes response headers before the body ends, so losing the
      // passthrough fails immediately instead of hanging app.inject on an SSE body.
      const response = await fetch(`${address}/mcp`, {
        method: "POST",
        signal: AbortSignal.any([controller.signal, context.signal]),
        headers: {
          ...HEADERS,
          "mcp-protocol-version": "2026-07-28",
          "mcp-method": "subscriptions/listen",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "subscriptions/listen",
          params: {
            _meta: MODERN_META,
            notifications: { toolsListChanged: true },
          },
        }),
      });
      assert.strictEqual(response.status, 200);
      assert.ok(
        !response.headers.get("content-type")?.includes("text/event-stream"),
        "a refused subscription must not open a stream"
      );
      const body = await response.json();
      assert.strictEqual(body.error.code, -32603);
      assert.match(body.error.message, /Subscription limit reached/);
    }
  );
});
