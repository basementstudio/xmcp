import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  buildFixture,
  mcpjamStdioTarget,
  mcpjamToolsCall,
  mcpjamToolsList,
  spawnStdioClient,
  type StdioClient,
} from "./_utils";

describe("stdio transport — basic-tools fixture", () => {
  let client: StdioClient;

  beforeAll(async () => {
    const built = await buildFixture("basic-tools");
    expect(built.exitCode).toBe(0);
    client = await spawnStdioClient("basic-tools");
  }, 90_000);

  afterAll(async () => {
    await client?.stop();
  });

  it("responds to initialize", async () => {
    const res = await client.request({
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "vitest", version: "1.0.0" },
      },
    });

    expect(res.error).toBeUndefined();
    expect(res.result).toBeDefined();
    const result = res.result as { serverInfo?: { name?: string } };
    expect(result.serverInfo?.name).toBeDefined();
  });

  it("lists the echo tool", async () => {
    client.notify({ method: "notifications/initialized" });
    const res = await client.request({ id: 2, method: "tools/list" });

    expect(res.error).toBeUndefined();
    const result = res.result as { tools: { name: string }[] };
    expect(Array.isArray(result.tools)).toBe(true);
    expect(result.tools.map((t) => t.name)).toContain("echo");
  });

  it("calls the echo tool and returns the message", async () => {
    const res = await client.request({
      id: 3,
      method: "tools/call",
      params: {
        name: "echo",
        arguments: { message: "ping" },
      },
    });

    expect(res.error).toBeUndefined();
    const result = res.result as {
      content: Array<{ type: string; text: string }>;
    };
    expect(result.content[0]?.text).toBe("echo: ping");
  });

  // mcpjam-driven layer: free protocol-conformance coverage from a real
  // third-party MCP client. Direct stdio tests above pin response shape;
  // these pin that an external CLI can drive the same server end to end.
  describe("via @mcpjam/cli", () => {
    const target = mcpjamStdioTarget("basic-tools");

    it("tools list returns the echo tool", async () => {
      const result = await mcpjamToolsList(target);
      expect(result.tools.map((t) => t.name)).toContain("echo");
    });

    it("tools call echo returns the message", async () => {
      const result = await mcpjamToolsCall(target, "echo", {
        message: "via-mcpjam",
      });
      expect(result.content[0]?.text).toBe("echo: via-mcpjam");
    });
  });
});
