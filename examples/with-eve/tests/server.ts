import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import type { TestContext } from "node:test";

/** Bounds server startup and every HTTP exchange without polling sleeps. */
export const TEST_TIMEOUT_MS = 20_000;

/** Starts the compiled server and resolves with its MCP endpoint. */
export async function startServer(
  context: TestContext,
  env: Record<string, string>
): Promise<string> {
  const child = spawn(process.execPath, ["dist/http.js"], {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  context.after(async () => {
    if (child.exitCode === null) {
      child.kill();
      await once(child, "exit");
    }
  });
  // xmcp starts at the configured port and moves up if it is busy.
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
  return endpoint;
}

/** Sends one stateless JSON-RPC request; every request repeats its own auth. */
export function rpc(endpoint: string, signal: AbortSignal) {
  let id = 0;
  return (method: string, params: unknown, token?: string) =>
    fetch(endpoint, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
    });
}

export async function decode(response: Response) {
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
}
