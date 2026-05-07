import { beforeAll, describe, expect, it } from "vitest";
import Fastify from "fastify";

// All DefinePlugin globals must be set before the adapter and server modules are
// loaded. HTTP_CONFIG and HTTP_CORS_CONFIG are captured at module evaluation
// time inside the adapter; INJECTED_* and SERVER_INFO are captured in
// utils/server.ts. The modules are loaded via dynamic import() inside
// beforeAll(), which runs after this synchronous initialisation.
const g = globalThis as Record<string, unknown>;
g["HTTP_CONFIG"] = {
  port: 3001,
  host: "127.0.0.1",
  bodySizeLimit: 10 * 1024 * 1024,
  endpoint: "/mcp",
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

describe("Fastify adapter", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let xmcpHandler!: (req: any, reply: any) => Promise<void>;
  let injectedTools!: Record<string, () => Promise<unknown>>;

  beforeAll(async () => {
    // Dynamically import AFTER globals are set so module-level initialisers see
    // the correct values.
    ({ xmcpHandler } = await import("@/runtime/adapters/fastify"));
    ({ injectedTools } = await import("@/runtime/utils/server"));
  });

  it("handles an initialize request successfully", async () => {
    const app = Fastify();
    app.post("/mcp", xmcpHandler);

    const response = await app.inject({
      method: "POST",
      url: "/mcp",
      headers: HEADERS,
      payload: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-03-26",
          capabilities: {},
          clientInfo: { name: "test", version: "1.0.0" },
        },
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.body).toContain('"serverInfo"');
    expect(response.body).toContain("test-server");
  });

  it("writes a 500 JSON-RPC error to reply.raw when createServer throws", async () => {
    // Inject a broken loader into the live injectedTools object so that the next
    // loadToolModules() call rejects, propagating up through createServer() and
    // into the catch block inside xmcpHandler. This works because injectedTools
    // is the same object reference that was captured from INJECTED_TOOLS above.
    injectedTools["__test_error__"] = async () => {
      throw new Error("forced load failure");
    };

    try {
      const app = Fastify();
      app.post("/mcp", xmcpHandler);

      const response = await app.inject({
        method: "POST",
        url: "/mcp",
        headers: HEADERS,
        payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
      });

      // After reply.hijack() the catch block writes directly to reply.raw.
      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body) as {
        jsonrpc: string;
        error: { code: number; message: string };
        id: unknown;
      };
      expect(body.jsonrpc).toBe("2.0");
      expect(body.error.code).toBe(-32603);
    } finally {
      delete injectedTools["__test_error__"];
    }
  });
});
