import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no live provider requests are used.
const preload = `globalThis.fetch = async (input, init) => {
 const request = new Request(input, init);
const url = new URL(request.url);
 if(url.origin !== "https://api.x.com" || request.headers.get("Authorization") !== "Bearer test-provider-key") throw new Error("Incorrect provider request");
 if(url.pathname === "/2/users/me" && request.method === "GET") return Response.json({data:{id:"123",name:"Example",username:"example"}});
 if(url.pathname === "/2/users/123/mentions" && request.method === "GET") {
  if(url.searchParams.get("max_results") !== "20") throw new Error("Incorrect limit");
  return Response.json({data:[{id:"999",text:"Hello"}],meta:{result_count:1}});
 }
 if(url.pathname === "/2/tweets" && request.method === "POST") {
  const body = await request.json();
  if(body.text !== "Thanks!" || body.reply.in_reply_to_tweet_id !== "999") throw new Error("Incorrect reply");
  return Response.json({data:{id:"1000",text:"Thanks!"}});
 }
 throw new Error("Unexpected provider request");
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
            X_USER_ACCESS_TOKEN: "test-provider-key",
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
                        name: "x-smoke",
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
          clientInfo: { name: "x-smoke", version: "1.0.0" },
        });
        assert.ok(initialized.result.capabilities.tools);
      }
      const listed = await rpc("tools/list", {});
      assert.deepEqual(
        listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
        ["get-x-profile", "list-x-mentions", "publish-x-post"]
      );
      const outputs: Record<string, unknown> = {};
      for (const name of [
        "get-x-profile",
        "list-x-mentions",
        "publish-x-post",
      ]) {
        const params = {
          name,
          arguments:
            name === "publish-x-post"
              ? { text: "Thanks!", replyToId: "999" }
              : {},
        };
        assert.equal((await request("tools/call", params, "")).status, 401);
        const called = await rpc("tools/call", params);
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        outputs[name] = JSON.parse(called.result.content[0].text);
      }
      assert.deepEqual(outputs, {
        "get-x-profile": {
          user: { id: "123", name: "Example", username: "example" },
        },
        "list-x-mentions": {
          user: { id: "123", name: "Example", username: "example" },
          mentions: [{ id: "999", text: "Hello" }],
          nextToken: null,
          newestId: null,
        },
        "publish-x-post": {
          post: { id: "1000", text: "Thanks!" },
          url: "https://x.com/i/status/1000",
        },
      });
      const invalid = await rpc("tools/call", {
        name: "publish-x-post",
        arguments: { text: "" },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
