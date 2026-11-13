import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no live provider requests are made.
const preload = `globalThis.fetch = async (input, init) => {
 const request = new Request(input, init);
 if (new URL(request.url).origin !== "https://api.github.com" || request.method !== "GET" || request.headers.get("Authorization") !== "Bearer test-provider-key") throw new Error("Unexpected provider request");
 const path = new URL(request.url).pathname;
 if (path === "/repos/example/repo/pulls") return Response.json([{"number": 1, "title": "Fix docs", "state": "open", "html_url": "https://github.com/example/repo/pull/1", "body": null, "draft": false}]);
 if (path === "/repos/example/repo/pulls/1") return Response.json({"number": 1, "title": "Fix docs", "state": "open", "html_url": "https://github.com/example/repo/pull/1", "body": null, "draft": false, "merged": false, "mergeable": null, "head": {"ref": "feature", "sha": "head-sha", "repo": null}, "base": {"ref": "main", "sha": "base-sha", "repo": {"full_name": "example/repo"}}});
 if (path === "/repos/example/repo/contents/README.md") return Response.json({ type: "file", path: "README.md", sha: "file-sha", size: 7, encoding: "base64", content: "IyBIZWxsbw==", html_url: "https://github.com/example/repo/blob/main/README.md" });
 throw new Error("Unexpected GitHub endpoint");
};`;
const cases = [
  {
    name: "list-pull-requests",
    arguments: { owner: "example", repo: "repo" },
    expected: {
      pullRequests: [
        {
          number: 1,
          title: "Fix docs",
          state: "open",
          html_url: "https://github.com/example/repo/pull/1",
          body: null,
          draft: false,
        },
      ],
      nextPage: null,
    },
  },
  {
    name: "get-pull-request",
    arguments: { owner: "example", repo: "repo", number: 1 },
    expected: {
      number: 1,
      title: "Fix docs",
      state: "open",
      html_url: "https://github.com/example/repo/pull/1",
      body: null,
      draft: false,
      merged: false,
      mergeable: null,
      head: { ref: "feature", sha: "head-sha", repo: null },
      base: {
        ref: "main",
        sha: "base-sha",
        repo: { full_name: "example/repo" },
      },
    },
  },
  {
    name: "read-repository-file",
    arguments: { owner: "example", repo: "repo", path: "README.md" },
    expected: {
      path: "README.md",
      sha: "file-sha",
      url: "https://github.com/example/repo/blob/main/README.md",
      content: "# Hello",
    },
  },
];

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
            GITHUB_TOKEN: "test-provider-key",
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
                        name: "github-smoke",
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
          clientInfo: { name: "github-smoke", version: "1.0.0" },
        });
        assert.ok(initialized.result.capabilities.tools);
      }
      const listed = await rpc("tools/list", {});
      assert.deepEqual(
        listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
        cases.map((item) => item.name).sort()
      );
      for (const item of cases) {
        const params = { name: item.name, arguments: item.arguments };
        assert.equal((await request("tools/call", params, "")).status, 401);
        const called = await rpc("tools/call", params);
        assert.equal(called.result?.isError, undefined, JSON.stringify(called));
        assert.deepEqual(
          JSON.parse(called.result.content[0].text),
          item.expected
        );
      }
      const invalid = await rpc("tools/call", {
        name: "read-repository-file",
        arguments: { owner: "example", repo: "repo", path: "../secret" },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
