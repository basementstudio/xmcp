import { afterEach, describe, expect, it, vi } from "vitest";
import { createHttpMcpClient } from "./App.js";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

function sseResponse(frames: unknown[]) {
  return new Response(
    frames.map((frame) => `data: ${JSON.stringify(frame)}\n\n`).join(""),
    { headers: { "content-type": "text/event-stream" } }
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("createHttpMcpClient", () => {
  it("matches multi-frame SSE responses to the outgoing request id", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        sseResponse([
          { jsonrpc: "2.0", method: "notifications/progress", params: {} },
          { jsonrpc: "2.0", id: 42, result: { ignored: true } },
          { jsonrpc: "2.0", id: 1, result: { protocolVersion: "2025-11-25" } },
        ])
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        sseResponse([
          { jsonrpc: "2.0", method: "notifications/progress", params: {} },
          { jsonrpc: "2.0", id: 1, result: { ignored: true } },
          {
            jsonrpc: "2.0",
            id: 2,
            result: { content: [{ type: "text", text: "matched" }] },
          },
        ])
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpMcpClient({ serverUrl: "https://example.com" });
    await expect(client.callTool({ name: "demo" })).resolves.toEqual({
      content: [{ type: "text", text: "matched" }],
    });
  });

  it("tolerates a non-success initialized notification response", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: "2.0", id: 1, result: {} })
      )
      .mockResolvedValueOnce(new Response("not supported", { status: 405 }))
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: "2.0", id: 2, result: { content: [] } })
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpMcpClient({ serverUrl: "https://example.com" });
    await expect(client.callTool({ name: "demo" })).resolves.toEqual({
      content: [],
    });
  });

  it("surfaces an error frame for the matching request", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        jsonResponse({ jsonrpc: "2.0", id: 1, result: {} })
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }))
      .mockResolvedValueOnce(
        sseResponse([
          { jsonrpc: "2.0", id: 99, error: { message: "wrong error" } },
          { jsonrpc: "2.0", id: 2, error: { message: "tool failed" } },
        ])
      );
    vi.stubGlobal("fetch", fetchMock);

    const client = createHttpMcpClient({ serverUrl: "https://example.com" });
    await expect(client.callTool({ name: "demo" })).rejects.toThrow(
      "tool failed"
    );
  });
});
