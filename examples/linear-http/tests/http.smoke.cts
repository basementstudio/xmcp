import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
// All outbound fetches in the child are intercepted; no live provider requests are made.
const preload = `globalThis.fetch = async (input, init) => {
 const request = new Request(input, init);
 if (request.url !== "https://api.linear.app/graphql" || request.method !== "POST" || request.headers.get("Authorization") !== "test-provider-key") throw new Error("Unexpected provider request");
 const body = await request.json();
 const pageInfo = { hasNextPage: false, endCursor: null };
 const issue = {"id": "issue-id", "identifier": "ENG-1", "title": "Fix docs", "url": "https://linear.app/example/issue/ENG-1"};
 if (body.query.includes("query ListTeams")) return Response.json({ data: { teams: { nodes: [{ id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794", key: "ENG", name: "Engineering" }], pageInfo } } });
 if (body.query.includes("query ListIssues")) return Response.json({ data: { issues: { nodes: [{ ...issue, description: null }], pageInfo } } });
 if (body.query.includes("mutation CreateIssue")) return Response.json({ data: { issueCreate: { success: true, issue } } });
 throw new Error("Unexpected GraphQL operation");
};`;
const cases = [
  {
    name: "list-linear-teams",
    arguments: {},
    expected: {
      teams: {
        nodes: [
          {
            id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
            key: "ENG",
            name: "Engineering",
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  },
  {
    name: "list-linear-issues",
    arguments: { teamId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" },
    expected: {
      issues: {
        nodes: [
          {
            id: "issue-id",
            identifier: "ENG-1",
            title: "Fix docs",
            url: "https://linear.app/example/issue/ENG-1",
            description: null,
          },
        ],
        pageInfo: { hasNextPage: false, endCursor: null },
      },
    },
  },
  {
    name: "create-linear-issue",
    arguments: {
      teamId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
      title: "Fix docs",
    },
    expected: {
      issueCreate: {
        success: true,
        issue: {
          id: "issue-id",
          identifier: "ENG-1",
          title: "Fix docs",
          url: "https://linear.app/example/issue/ENG-1",
        },
      },
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
            LINEAR_API_KEY: "test-provider-key",
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
                        name: "linear-smoke",
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
          clientInfo: { name: "linear-smoke", version: "1.0.0" },
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
        name: "create-linear-issue",
        arguments: {
          teamId: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794",
          title: " ",
        },
      });
      assert.ok(invalid.error || invalid.result?.isError);
    }
  );
}
