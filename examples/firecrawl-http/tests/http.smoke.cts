import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no Firecrawl credits are used.
const preload = `globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (new URL(request.url).origin !== "https://api.firecrawl.dev" || request.method !== "POST") throw new Error("Unexpected provider request");
  if (request.headers.get("Authorization") !== "Bearer test-provider-key") throw new Error("Incorrect provider key");
  const body = await request.json();
  if (request.url.endsWith("/v2/map")) {
    if (body.limit !== 20 || body.includeSubdomains !== false) throw new Error("Incorrect discovery defaults");
    return Response.json({ success: true, links: [{ url: "https://example.com/docs" }] });
  }
  if (!request.url.endsWith("/v2/scrape") || body.onlyMainContent !== true) throw new Error("Incorrect scrape request");
  if (body.formats[0] === "markdown") return Response.json({ success: true, data: { markdown: "# Example" } });
  if (body.formats[0].type !== "json") throw new Error("Incorrect extraction format");
  return Response.json({ success: true, data: { json: { title: "Example", description: null, headings: ["Example"], topics: ["Documentation"] } } });
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
            FIRECRAWL_API_KEY: "test-provider-key",
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
                        name: "firecrawl-smoke",
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
          clientInfo: { name: "firecrawl-smoke", version: "1.0.0" },
        });
        assert.ok(initialized.result.capabilities.tools);
      }
      const listed = await rpc("tools/list", {});
      assert.deepEqual(
        listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
        ["extract-page-summary", "map-site", "scrape-page"]
      );
      const outputs: Record<string, unknown> = {};
      for (const name of ["scrape-page", "extract-page-summary", "map-site"]) {
        const params = { name, arguments: { url: "https://example.com" } };
        assert.equal((await request("tools/call", params, "")).status, 401);
        const called = await rpc("tools/call", params);
        assert.equal(called.result.isError, undefined, JSON.stringify(called));
        outputs[name] = JSON.parse(called.result.content[0].text);
      }
      assert.deepEqual(outputs, {
        "scrape-page": { success: true, data: { markdown: "# Example" } },
        "extract-page-summary": {
          success: true,
          data: {
            json: {
              title: "Example",
              description: null,
              headings: ["Example"],
              topics: ["Documentation"],
            },
          },
        },
        "map-site": {
          success: true,
          links: [{ url: "https://example.com/docs" }],
        },
      });
      const invalid = await rpc("tools/call", {
        name: "map-site",
        arguments: { url: "https://example.com", limit: 101 },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
