import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no live provider requests are used.
const preload = `globalThis.fetch = async (input, init) => {
 const request = new Request(input, init);
if(request.url !== "https://api.x.ai/v1/responses" || request.method !== "POST" || request.headers.get("Authorization") !== "Bearer test-provider-key") throw new Error("Incorrect provider request");
 const body = await request.json();
 if(body.model !== "grok-4.7" || body.store !== false || body.stream !== false || body.max_output_tokens !== 1024) throw new Error("Incorrect defaults");
 const name = body.input[0].content;
 if(name === "ask-grok") { if(body.tools) throw new Error("Unexpected search"); }
 else {
  if(body.tools[0].type !== (name === "search-web-with-grok" ? "web_search" : "x_search") || body.max_turns !== 3 || body.tool_choice !== "required") throw new Error("Incorrect search");
 }
 return Response.json({id:"response-id",model:"grok-4.7",status:"completed",output:[{type:"message",role:"assistant",content:[{type:"output_text",text:"Answer",annotations:[{type:"url_citation",url:"https://example.com",title:"Source"}]}]}]});
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
            XAI_API_KEY: "test-provider-key",
            XAI_MODEL: "grok-4.7",
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
                        name: "grok-smoke",
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
          clientInfo: { name: "grok-smoke", version: "1.0.0" },
        });
        assert.ok(initialized.result.capabilities.tools);
      }
      const listed = await rpc("tools/list", {});
      assert.deepEqual(
        listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
        ["ask-grok", "search-web-with-grok", "search-x-with-grok"]
      );
      const outputs: Record<string, unknown> = {};
      for (const name of [
        "ask-grok",
        "search-web-with-grok",
        "search-x-with-grok",
      ]) {
        const params = {
          name,
          arguments: { prompt: name },
        };
        assert.equal((await request("tools/call", params, "")).status, 401);
        const called = await rpc("tools/call", params);
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        outputs[name] = JSON.parse(called.result.content[0].text);
      }
      assert.deepEqual(outputs, {
        "ask-grok": {
          responseId: "response-id",
          model: "grok-4.7",
          text: "Answer",
          citations: [{ url: "https://example.com", title: "Source" }],
        },
        "search-web-with-grok": {
          responseId: "response-id",
          model: "grok-4.7",
          text: "Answer",
          citations: [{ url: "https://example.com", title: "Source" }],
        },
        "search-x-with-grok": {
          responseId: "response-id",
          model: "grok-4.7",
          text: "Answer",
          citations: [{ url: "https://example.com", title: "Source" }],
        },
      });
      const invalid = await rpc("tools/call", {
        name: "ask-grok",
        arguments: { prompt: "" },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
