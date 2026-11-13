import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { test } from "node:test";

// Bound startup and requests if the built server regresses.
const TEST_TIMEOUT_MS = 15_000;
const emailId = "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794";
// The child process cannot reach Resend: all SDK requests use this fake fetch.
const preload = `globalThis.fetch = async (input, init) => {
  const request = new Request(input, init);
  if (request.url === "https://api.resend.com/inboxes?limit=20" && request.method === "GET") return Response.json({ object: "list", has_more: false, data: [{ id: "${emailId}", email_address: "support@example.com" }] });
  if (request.url !== "https://api.resend.com/emails" || request.method !== "POST") throw new Error("Unexpected provider request");
  return Response.json({ id: "${emailId}" });
};`;

test(
  "the built server authenticates, discovers inbox tools, validates inputs, and executes mocked SDK requests",
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
          RESEND_API_KEY: "re_test_only",
          RESEND_FROM: "demo@example.com",
        },
        stdio: ["ignore", "pipe", "pipe"],
      }
    );
    context.after(async () => {
      if (child.exitCode === null) {
        child.kill();
        await once(child, "exit");
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
    const call = (
      key: string,
      method = "tools/call",
      params: Record<string, unknown> = {
        name: "send-email",
        arguments: {
          to: "delivered@resend.dev",
          subject: "Mock test",
          text: "Not sent",
        },
      }
    ) =>
      fetch(endpoint, {
        method: "POST",
        signal: AbortSignal.timeout(TEST_TIMEOUT_MS),
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "x-api-key": key,
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method,
          params,
        }),
      });
    assert.equal((await call("wrong")).status, 401);
    const response = await call("test-client-key");
    assert.equal(response.status, 200);
    const text = await response.text();
    const decode = (text: string) =>
      JSON.parse(
        text.startsWith("{")
          ? text
          : text
              .split("\n")
              .find((line) => line.startsWith("data: "))!
              .slice(6)
      );
    const data = decode(text);
    assert.equal(data.result.isError, undefined);
    assert.deepEqual(JSON.parse(data.result.content[0].text), { id: emailId });
    const list = decode(
      await (await call("test-client-key", "tools/list", {})).text()
    );
    const names = list.result.tools.map((tool: { name: string }) => tool.name);
    for (const name of [
      "create-inbox",
      "get-inbox",
      "list-inboxes",
      "list-inbox-threads",
      "get-inbox-thread",
      "list-inbox-emails",
      "create-inbox-reply-draft",
      "get-inbox-draft",
      "send-inbox-draft",
      "reply-inbox-email",
    ])
      assert(names.includes(name), name);
    const inboxCall = { name: "list-inboxes", arguments: {} };
    assert.equal((await call("wrong", "tools/call", inboxCall)).status, 401);
    const inboxes = decode(
      await (await call("test-client-key", "tools/call", inboxCall)).text()
    );
    assert.equal(inboxes.result.isError, undefined);
    assert.equal(
      JSON.parse(inboxes.result.content[0].text).data[0].email_address,
      "support@example.com"
    );
    const invalid = decode(
      await (
        await call("test-client-key", "tools/call", {
          name: "get-inbox",
          arguments: { inboxId: "../other" },
        })
      ).text()
    );
    assert(
      invalid.error || invalid.result?.isError,
      "invalid IDs must be rejected"
    );
  }
);
