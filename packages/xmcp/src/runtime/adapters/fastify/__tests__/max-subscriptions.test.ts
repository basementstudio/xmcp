import { describe, it, before } from "node:test";
import assert from "node:assert";
import Fastify from "fastify";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let xmcpHandler!: (req: any, reply: any) => Promise<void>;

  before(async () => {
    ({ xmcpHandler } = (await import("../index")) as {
      xmcpHandler: typeof xmcpHandler;
    });
  });

  it("refuses subscriptions/listen in band when the cap is 0", async () => {
    const app = Fastify();
    app.post("/mcp", xmcpHandler);

    const response = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: {
        ...HEADERS,
        "mcp-protocol-version": "2026-07-28",
        "mcp-method": "subscriptions/listen",
      },
      payload: {
        jsonrpc: "2.0",
        id: 1,
        method: "subscriptions/listen",
        params: {
          _meta: MODERN_META,
          notifications: { toolsListChanged: true },
        },
      },
    });

    // Refused before the acknowledgment, so this is a single JSON response
    // rather than the SSE stream an uncapped server would hold open.
    assert.strictEqual(response.statusCode, 200);
    assert.ok(
      !(response.headers["content-type"] as string).includes(
        "text/event-stream"
      ),
      "a refused subscription must not open a stream"
    );
    const body = JSON.parse(response.body) as {
      error: { code: number; message: string };
    };
    assert.strictEqual(body.error.code, -32603);
    // Named so the assertion cannot pass on an unrelated internal error.
    assert.match(body.error.message, /Subscription limit reached/);
  });
});
