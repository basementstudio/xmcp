import { before, describe, it } from "node:test";
import assert from "node:assert/strict";
import type { ToolExtraArguments } from "@/types/tool";
import { getHttpRequestContext } from "@/runtime/contexts/http-request-context";

const globals = globalThis as Record<string, unknown>;
Object.assign(globals, {
  SERVER_INFO: { name: "fetch-test", version: "1.0.0" },
  IS_CLOUDFLARE: false,
  INJECTED_CLIENT_BUNDLES: undefined,
  INJECTED_MIDDLEWARE: undefined,
  INJECTED_TOOLS: {
    "src/tools/identity.ts": async () => ({
      metadata: {
        name: "identity",
        description: "Inspect the current request",
      },
      schema: {},
      default: async (_args: unknown, extra: ToolExtraArguments) => {
        await Promise.resolve();
        return JSON.stringify({
          header: getHttpRequestContext().headers["x-test-request"],
          client: extra.clientInfo?.name,
          auth: extra.authInfo?.clientId,
        });
      },
    }),
  },
  INJECTED_PROMPTS: {
    "src/prompts/hello.ts": async () => ({
      metadata: { name: "hello", title: "Hello", description: "A greeting" },
      schema: {},
      default: () => "Hello from a prompt",
    }),
  },
  INJECTED_RESOURCES: {
    "src/resources/(config)/info.ts": async () => ({
      metadata: { name: "info", mimeType: "text/plain" },
      default: () => "Resource content",
    }),
  },
});

let xmcpHandler: typeof import("../index").xmcpHandler;
before(async () => {
  ({ xmcpHandler } = await import("../index"));
});

function request(
  method: string,
  params?: object,
  headers: Record<string, string> = {}
) {
  return new Request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...headers,
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

async function body(response: Response) {
  const text = await response.text();
  if (response.headers.get("content-type")?.includes("text/event-stream")) {
    const data = text
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .at(-1);
    assert.ok(data, text);
    return JSON.parse(data.slice(6));
  }
  return JSON.parse(text);
}

describe("Fetch adapter", () => {
  it("initializes without a session and does not carry client identity into later calls", async () => {
    const initialized = await xmcpHandler(
      request("initialize", {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "initial-client", version: "1" },
      })
    );
    assert.equal(initialized.status, 200);
    assert.equal(initialized.headers.get("mcp-session-id"), null);
    assert.equal(
      (await body(initialized)).result.serverInfo.name,
      "fetch-test"
    );
    const called = await body(
      await xmcpHandler(
        request("tools/call", { name: "identity", arguments: {} })
      )
    );
    assert.equal(JSON.parse(called.result.content[0].text).client, undefined);
  });

  it("isolates headers, repeated client metadata, and verified auth across concurrent requests", async () => {
    await Promise.all(
      ["alice", "bob"].map(async (name) => {
        const response = await xmcpHandler(
          request(
            "tools/call",
            { name: "identity", arguments: {} },
            {
              "x-test-request": name,
              "x-mcp-client-name": name,
              "x-mcp-client-version": "1",
            }
          ),
          { authInfo: { token: name, clientId: name, scopes: [] } }
        );
        assert.equal(response.status, 200);
        const result = await body(response);
        assert.deepEqual(JSON.parse(result.result.content[0].text), {
          header: name,
          client: name,
          auth: name,
        });
      })
    );
  });

  it("supports modern discovery and tools without session state", async () => {
    const meta = {
      "io.modelcontextprotocol/protocolVersion": "2026-07-28",
      "io.modelcontextprotocol/clientCapabilities": {},
      "io.modelcontextprotocol/clientInfo": { name: "modern", version: "1" },
    };
    const response = await xmcpHandler(
      request(
        "server/discover",
        { _meta: meta },
        {
          "mcp-protocol-version": "2026-07-28",
          "mcp-method": "server/discover",
        }
      )
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("mcp-session-id"), null);
    assert.match(JSON.stringify(await body(response)), /2026-07-28/);
    const called = await body(
      await xmcpHandler(
        request(
          "tools/call",
          {
            name: "identity",
            arguments: {},
            _meta: meta,
          },
          {
            "mcp-protocol-version": "2026-07-28",
            "mcp-method": "tools/call",
            "mcp-name": "identity",
          }
        )
      )
    );
    assert.ok(called.result, JSON.stringify(called));
    assert.equal(JSON.parse(called.result.content[0].text).client, "modern");
  });

  it("registers tools, prompts, and resources through the shared loaders", async () => {
    const tools = await body(await xmcpHandler(request("tools/list")));
    assert.equal(tools.result.tools[0].name, "identity");
    const prompt = await body(
      await xmcpHandler(
        request("prompts/get", { name: "hello", arguments: {} })
      )
    );
    assert.equal(prompt.result.messages[0].content.text, "Hello from a prompt");
    const resources = await body(await xmcpHandler(request("resources/list")));
    assert.equal(resources.result.resources[0].name, "info");
    const resource = await body(
      await xmcpHandler(
        request("resources/read", { uri: resources.result.resources[0].uri })
      )
    );
    assert.equal(resource.result.contents[0].text, "Resource content");
  });

  it("lets the SDK validate malformed JSON without consuming its request body", async () => {
    const response = await xmcpHandler(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
        },
        body: "{",
      })
    );
    assert.equal(response.status, 400);
    assert.equal((await body(response)).error.code, -32700);
  });

  it("delegates unsupported HTTP methods to the stateless transport", async () => {
    for (const method of ["GET", "DELETE", "PUT"]) {
      const response = await xmcpHandler(
        new Request("http://localhost/mcp", {
          method,
          headers: { accept: "text/event-stream" },
        })
      );
      assert.equal(response.status, 405);
    }
  });
});
