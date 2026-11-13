import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound local server startup and HTTP failures without polling sleeps.
const TEST_TIMEOUT_MS = 15_000;

test(
  "built MCP server authenticates both routes, validates calls, and completes a canvas operation",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    const child = spawn(process.execPath, ["dist/http.js"], {
      env: {
        ...process.env,
        MCP_API_KEY: "client-test-key",
        FIGMA_BRIDGE_KEY: "plugin-test-key",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    context.after(async () => {
      if (child.exitCode === null) {
        child.kill();
        await once(child, "exit");
      }
    });
    const endpoint = await new Promise<string>((resolve, reject) => {
      let output = "";
      child.stdout.on("data", (data) => {
        output += data;
        const match = output.match(/http:\/\/127\.0\.0\.1:\d+\/mcp/);
        if (match) resolve(match[0]);
      });
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error(`Server exited: ${code}`)));
    });
    const signal = AbortSignal.timeout(TEST_TIMEOUT_MS);
    let id = 0;
    const request = (body: unknown, key = "client-test-key") =>
      fetch(endpoint, {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "x-api-key": key,
        },
        body: JSON.stringify({ jsonrpc: "2.0", id: ++id, ...(body as object) }),
      });
    const decode = async (response: Response) => {
      assert.equal(response.status, 200);
      const text = await response.text();
      return JSON.parse(
        text.startsWith("{")
          ? text
          : text
              .split("\n")
              .find((line) => line.startsWith("data: "))!
              .slice(6)
      );
    };
    const call = async (name: string, args = {}) =>
      decode(
        await request({
          method: "tools/call",
          params: { name, arguments: args },
        })
      );
    assert.equal(
      (await request({ method: "tools/list" }, "invalid")).status,
      401
    );
    const list = await decode(await request({ method: "tools/list" }));
    assert.equal(list.result.tools.length, 5);
    assert.equal(
      list.result.tools.find(
        (tool: { name: string }) => tool.name === "create-figma-node"
      ).annotations.readOnlyHint,
      false
    );
    const info = {
      sessionId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
      pageId: "1:2",
      documentName: "Mock document",
      pageName: "Page",
    };
    const plugin = (
      path: string,
      body: unknown,
      key = "plugin-test-key",
      origin = "null"
    ) =>
      fetch(new URL(`/figma/${path}`, endpoint), {
        method: "POST",
        signal,
        headers: {
          "content-type": "application/json",
          "x-figma-bridge-key": key,
          origin,
        },
        body: JSON.stringify(body),
      });
    assert.equal((await plugin("poll", info, "wrong")).status, 401);
    assert.equal(
      (
        await plugin(
          "poll",
          info,
          "plugin-test-key",
          "https://untrusted.example"
        )
      ).status,
      403
    );
    assert.equal((await plugin("poll", {})).status, 400);
    const polling = plugin("poll", info);
    while (true) {
      const status = await call("figma-status");
      if (JSON.parse(status.result.content[0].text).connected) break;
      signal.throwIfAborted();
    }
    const invalid = await call("create-figma-node", {
      sessionId: info.sessionId,
      kind: "frame",
      name: "Invalid",
      width: -1,
    });
    assert.ok(invalid.error || invalid.result?.isError);
    const executing = call("create-figma-node", {
      sessionId: info.sessionId,
      kind: "frame",
      name: "Demo",
    });
    const command = await (await polling).json();
    assert.equal(command.operation, "create");
    assert.equal(command.arguments.width, 320);
    assert.equal(command.pageId, info.pageId);
    assert.equal(
      (
        await plugin("result", {
          sessionId: info.sessionId,
          id: command.id,
          result: { content: [{ type: "text", text: '{"id":"2:3"}' }] },
        })
      ).status,
      204
    );
    assert.equal((await executing).result.content[0].text, '{"id":"2:3"}');
  }
);
