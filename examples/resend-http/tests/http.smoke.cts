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
  if (request.url !== "https://api.resend.com/emails" || request.method !== "POST") throw new Error("Unexpected provider request");
  return Response.json({ id: "${emailId}" });
};`;

test(
  "the built server authenticates requests and executes send-email with a mocked SDK response",
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
    const call = (key: string) =>
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
          method: "tools/call",
          params: {
            name: "send-email",
            arguments: {
              to: "delivered@resend.dev",
              subject: "Mock test",
              text: "Not sent",
            },
          },
        }),
      });
    assert.equal((await call("wrong")).status, 401);
    const response = await call("test-client-key");
    assert.equal(response.status, 200);
    const text = await response.text();
    const data = JSON.parse(
      text.startsWith("{")
        ? text
        : text
            .split("\n")
            .find((line) => line.startsWith("data: "))!
            .slice(6)
    );
    assert.equal(data.result.isError, undefined);
    assert.deepEqual(JSON.parse(data.result.content[0].text), { id: emailId });
  }
);
