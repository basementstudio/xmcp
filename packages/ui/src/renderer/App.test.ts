import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpMcpClient, MCP_REQUEST_TIMEOUT_MS } from "./http-client.js";

type RpcRequest = {
  id: string | number;
  method: string;
  params?: Record<string, unknown>;
};
const result = { content: [{ type: "text", text: "matched" }] };
const clients: ReturnType<typeof createHttpMcpClient>[] = [];

function jsonResponse(body: unknown, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json", ...headers },
  });
}

function mockServer({
  modern = false,
  session = false,
  call = (request: RpcRequest) =>
    jsonResponse({ jsonrpc: "2.0", id: request.id, result }),
}: {
  modern?: boolean;
  session?: boolean;
  call?: (request: RpcRequest) => Response;
} = {}) {
  const requests: { rpc?: RpcRequest; init: RequestInit; url: string }[] = [];
  let sessionNumber = 0;
  const fetchMock = vi.fn<typeof fetch>(async (url, init = {}) => {
    const rpc = init.body
      ? (JSON.parse(String(init.body)) as RpcRequest)
      : undefined;
    requests.push({ rpc, init, url: String(url) });
    if (init.method === "DELETE") return new Response(null, { status: 204 });
    if (!rpc) return new Response(null, { status: 405 });
    if (rpc.method === "server/discover") {
      return jsonResponse(
        modern
          ? {
              jsonrpc: "2.0",
              id: rpc.id,
              result: {
                supportedVersions: ["2026-07-28"],
                capabilities: { tools: {} },
                ttlMs: 0,
                cacheScope: "private",
              },
            }
          : {
              jsonrpc: "2.0",
              id: rpc.id,
              error: { code: -32601, message: "Method not found" },
            }
      );
    }
    if (rpc.method === "initialize") {
      return jsonResponse(
        {
          jsonrpc: "2.0",
          id: rpc.id,
          result: {
            protocolVersion: "2025-11-25",
            capabilities: { tools: {} },
            serverInfo: { name: "test", version: "1" },
          },
        },
        session ? { "mcp-session-id": `session-${++sessionNumber}` } : undefined
      );
    }
    if (rpc.method.startsWith("notifications/"))
      return new Response(null, { status: 202 });
    if (rpc.method === "tools/list")
      return jsonResponse({
        jsonrpc: "2.0",
        id: rpc.id,
        result: {
          tools: [{ name: "demo", inputSchema: { type: "object" } }],
          ttlMs: 0,
          cacheScope: "private",
        },
      });
    if (rpc.method === "tools/call") return call(rpc);
    throw new Error(`Unexpected request: ${rpc.method}`);
  });
  vi.stubGlobal("fetch", fetchMock);
  return { requests, fetchMock };
}

function client(
  options: Partial<Parameters<typeof createHttpMcpClient>[0]> = {}
) {
  const instance = createHttpMcpClient({
    serverUrl: "https://example.com",
    ...options,
  });
  clients.push(instance);
  return instance;
}

afterEach(async () => {
  await Promise.all(clients.splice(0).map((instance) => instance.close()));
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createHttpMcpClient", () => {
  it("negotiates modern stateless requests without initializing a session", async () => {
    const { requests } = mockServer({
      modern: true,
      call: (rpc) =>
        jsonResponse({
          jsonrpc: "2.0",
          id: rpc.id,
          result: { ...result, resultType: "complete" },
        }),
    });
    const instance = client();
    await expect(instance.callTool({ name: "demo" })).resolves.toMatchObject(
      result
    );
    await instance.callTool({ name: "demo" });
    expect(
      requests.filter(({ rpc }) => rpc?.method === "server/discover")
    ).toHaveLength(1);
    expect(requests.some(({ rpc }) => rpc?.method === "initialize")).toBe(
      false
    );
    for (const { rpc, init } of requests.filter(
      ({ rpc }) => rpc?.method === "tools/call"
    )) {
      expect(new Headers(init.headers).get("mcp-session-id")).toBeNull();
      expect(JSON.stringify(rpc)).toContain("xmcp-ui");
    }
  });

  it("shares legacy initialization across concurrent calls and filters unsafe headers", async () => {
    const { requests } = mockServer();
    const instance = client({
      serverUrl: "https://example.com/api/?tenant=one#fragment",
      headers: [
        { name: "Authorization", value: "Bearer token" },
        { name: "Bad Header", value: "invalid" },
        { name: "Host", value: "attacker.example" },
        { name: "Content-Length", value: "1" },
        { name: "Mcp-Protocol-Version", value: "invalid" },
        { name: "Mcp-Session-Id", value: "injected" },
        { name: "X-Unsafe", value: "one\r\ntwo" },
      ],
    });
    await Promise.all([
      instance.callTool({ name: "demo" }),
      instance.callTool({ name: "demo" }),
    ]);
    expect(
      requests.filter(({ rpc }) => rpc?.method === "initialize")
    ).toHaveLength(1);
    for (const request of requests) {
      expect(request.url).toBe("https://example.com/api/mcp?tenant=one");
      expect(request.init.redirect).toBe("error");
      const headers = new Headers(request.init.headers);
      expect(headers.get("authorization")).toBe("Bearer token");
      for (const name of [
        "host",
        "content-length",
        "mcp-session-id",
        "x-unsafe",
      ])
        expect(headers.get(name)).toBeNull();
      expect(headers.get("mcp-protocol-version")).not.toBe("invalid");
    }
  });

  it("correlates SSE frames and surfaces matching JSON-RPC errors", async () => {
    let failed = false;
    mockServer({
      call: (rpc) =>
        new Response(
          [
            { jsonrpc: "2.0", id: "unrelated", result: { content: [] } },
            failed
              ? {
                  jsonrpc: "2.0",
                  id: rpc.id,
                  error: { code: -32603, message: "tool failed" },
                }
              : { jsonrpc: "2.0", id: rpc.id, result },
          ]
            .map(
              (frame) => `event: message\ndata: ${JSON.stringify(frame)}\n\n`
            )
            .join(""),
          {
            headers: { "content-type": "text/event-stream" },
          }
        ),
    });
    const instance = client();
    await expect(instance.callTool({ name: "demo" })).resolves.toMatchObject(
      result
    );
    failed = true;
    await expect(instance.callTool({ name: "demo" })).rejects.toThrow(
      "tool failed"
    );
  });

  it("rejects an uncorrelated JSON response instead of accepting its result", async () => {
    vi.useFakeTimers();
    mockServer({
      call: () => jsonResponse({ jsonrpc: "2.0", id: "unrelated", result }),
    });
    const pending = expect(client().callTool({ name: "demo" })).rejects.toThrow(
      /timed out/i
    );
    await vi.advanceTimersByTimeAsync(MCP_REQUEST_TIMEOUT_MS);
    await pending;
  });

  it("reuses and deletes a stateful session, then reconnects after cleanup", async () => {
    const { requests } = mockServer({ session: true });
    const instance = client();
    await instance.callTool({ name: "demo" });
    await instance.callTool({ name: "demo" });
    await instance.close();
    const calls = requests.filter(({ rpc }) => rpc?.method === "tools/call");
    expect(
      calls.map(({ init }) => new Headers(init.headers).get("mcp-session-id"))
    ).toEqual(["session-1", "session-1"]);
    expect(
      requests.filter(({ init }) => init.method === "DELETE")
    ).toHaveLength(1);
    await instance.callTool({ name: "demo" });
    expect(
      requests.filter(({ rpc }) => rpc?.method === "initialize")
    ).toHaveLength(2);
  });

  it("does not replay a tool after session expiry; the next action reconnects", async () => {
    let expired = true;
    const { requests } = mockServer({
      session: true,
      call: (rpc) =>
        expired
          ? new Response("expired", { status: 404 })
          : jsonResponse({ jsonrpc: "2.0", id: rpc.id, result }),
    });
    const instance = client();
    await expect(instance.callTool({ name: "demo" })).rejects.toThrow();
    expect(
      requests.filter(({ rpc }) => rpc?.method === "tools/call")
    ).toHaveLength(1);
    expired = false;
    await expect(instance.callTool({ name: "demo" })).resolves.toMatchObject(
      result
    );
    expect(
      requests.filter(({ rpc }) => rpc?.method === "initialize")
    ).toHaveLength(2);
  });

  it("can retry connecting after a network failure", async () => {
    const { fetchMock } = mockServer();
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    const instance = client();
    await expect(instance.callTool({ name: "demo" })).rejects.toThrow(
      "offline"
    );
    await expect(instance.callTool({ name: "demo" })).resolves.toMatchObject(
      result
    );
  });

  it.each(["file:///tmp/mcp", "https://user:password@example.com"])(
    "rejects unsafe endpoint %s",
    (serverUrl) => {
      expect(() => client({ serverUrl })).toThrow(
        "HTTP(S) without embedded credentials"
      );
    }
  );
});
