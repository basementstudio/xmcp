import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no Browserbase browser minutes are used.
const preload = `globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (new URL(request.url).origin !== "https://api.browserbase.com") throw new Error("Unexpected provider origin");
  if (request.headers.get("X-BB-API-Key") !== "test-provider-key") throw new Error("Incorrect provider key");
  const path = new URL(request.url).pathname;
  if (path === "/v1/sessions") {
    const body = await request.json();
    if (request.method !== "POST" || body.timeout !== 300 || body.keepAlive !== false) throw new Error("Incorrect creation defaults");
  } else {
    if (path !== "/v1/sessions/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794") throw new Error("Incorrect session path");
    if (request.method === "POST") {
      if ((await request.json()).status !== "REQUEST_RELEASE") throw new Error("Incorrect release request");
    } else if (request.method !== "GET") throw new Error("Incorrect method");
  }
  return Response.json({ ...{"id": "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794", "status": "RUNNING", "projectId": "project-id", "expiresAt": "2026-10-23T12:05:00Z", "keepAlive": false, "region": "us-west-2"}, connectUrl: "test-provider-key", signingKey: "test-provider-key" });
};`;

for (const protocolVersion of ["2025-03-26", "2026-07-28"]) {
  test(
    `built HTTP server authenticates requests and executes all three tools with MCP ${protocolVersion}`,
    { timeout: TEST_TIMEOUT_MS },
    async (context) => {
      const child = spawn(
        process.execPath,
        [
          "--import",
          `data:text/javascript,${encodeURIComponent(preload)}`,
          "dist/http.js",
        ],
        {
          env: {
            ...process.env,
            MCP_API_KEY: "test-client-key",
            BROWSERBASE_API_KEY: "test-provider-key",
          },
          stdio: ["ignore", "pipe", "pipe"],
        }
      );
      context.after(async () => {
        if (child.exitCode === null && child.signalCode === null) {
          const exited = once(child, "exit");
          child.kill();
          await exited;
        }
      });
      const endpoint = await new Promise<string>((resolve, reject) => {
        let output = "";
        let errors = "";
        child.stderr.on("data", (data) => {
          errors = (errors + data).slice(-2000);
        });
        child.stdout.on("data", (data) => {
          output += data;
          const match = output.match(/http:\/\/[^\s]+\/mcp/);
          if (match) resolve(match[0]);
        });
        child.once("error", reject);
        child.once("exit", (code) =>
          reject(new Error(`Server exited: ${code}. ${errors}`))
        );
      });
      const request = (
        method: string,
        params: Record<string, unknown>,
        key = "test-client-key"
      ) =>
        fetch(endpoint, {
          method: "POST",
          signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            "x-api-key": key,
            ...(protocolVersion === "2026-07-28"
              ? {
                  "mcp-protocol-version": protocolVersion,
                  "mcp-method": method,
                  ...(typeof params.name === "string"
                    ? { "mcp-name": params.name }
                    : {}),
                }
              : {}),
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method,
            params: {
              ...params,
              // Current stateless clients repeat negotiation metadata on every request.
              ...(protocolVersion === "2026-07-28"
                ? {
                    _meta: {
                      "io.modelcontextprotocol/protocolVersion":
                        protocolVersion,
                      "io.modelcontextprotocol/clientCapabilities": {},
                      "io.modelcontextprotocol/clientInfo": {
                        name: "browserbase-smoke",
                        version: "1.0.0",
                      },
                    },
                  }
                : {}),
            },
          }),
        });
      const rpc = async (method: string, params: Record<string, unknown>) => {
        const response = await request(method, params);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("mcp-session-id"), null);
        const text = await response.text();
        assert.doesNotMatch(text, /test-provider-key/);
        return JSON.parse(
          text.startsWith("{")
            ? text
            : text
                .split("\n")
                .find((line) => line.startsWith("data: "))!
                .slice(6)
        );
      };
      assert.equal((await request("tools/list", {}, "wrong")).status, 401);
      if (protocolVersion === "2025-03-26") {
        const initialized = await rpc("initialize", {
          protocolVersion,
          capabilities: {},
          clientInfo: { name: "browserbase-smoke", version: "1.0.0" },
        });
        assert.ok(initialized.result.capabilities.tools);
      }
      const listed = await rpc("tools/list", {});
      assert.deepEqual(
        listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
        [
          "create-browser-session",
          "get-browser-session",
          "release-browser-session",
        ]
      );
      const outputs: Record<string, unknown> = {};
      for (const name of [
        "create-browser-session",
        "get-browser-session",
        "release-browser-session",
      ]) {
        const params = {
          name,
          arguments:
            name === "create-browser-session"
              ? {}
              : { sessionId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" },
        };
        assert.equal((await request("tools/call", params, "")).status, 401);
        const called = await rpc("tools/call", params);
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        outputs[name] = JSON.parse(called.result.content[0].text);
      }
      assert.deepEqual(outputs, {
        "create-browser-session": {
          session: {
            id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
            status: "RUNNING",
            projectId: "project-id",
            expiresAt: "2026-10-23T12:05:00Z",
            keepAlive: false,
            region: "us-west-2",
          },
          dashboardUrl:
            "https://www.browserbase.com/sessions/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
        },
        "get-browser-session": {
          session: {
            id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
            status: "RUNNING",
            projectId: "project-id",
            expiresAt: "2026-10-23T12:05:00Z",
            keepAlive: false,
            region: "us-west-2",
          },
          dashboardUrl:
            "https://www.browserbase.com/sessions/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
        },
        "release-browser-session": {
          session: {
            id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
            status: "RUNNING",
            projectId: "project-id",
            expiresAt: "2026-10-23T12:05:00Z",
            keepAlive: false,
            region: "us-west-2",
          },
          dashboardUrl:
            "https://www.browserbase.com/sessions/49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
        },
      });
      const invalid = await rpc("tools/call", {
        name: "create-browser-session",
        arguments: { timeoutSeconds: 3601 },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
