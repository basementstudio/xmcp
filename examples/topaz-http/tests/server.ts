import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import type { TestContext } from "node:test";

/** Bounds server startup and every request if the built server regresses. */
export const TEST_TIMEOUT_MS = 20_000;
export const PROTOCOL_VERSIONS = ["2025-03-26", "2026-07-28"] as const;
/** A 1x1 transparent PNG, returned as the fake provider's output image. */
export const PNG_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/**
 * Starts the built server with every outbound fetch intercepted by `preload`,
 * so no live provider requests are made, and resolves with its endpoint.
 */
export async function startServer(
  context: TestContext,
  preload: string,
  env: Record<string, string>
): Promise<string> {
  const child = spawn(
    process.execPath,
    [
      "--import",
      `data:text/javascript,${encodeURIComponent(preload)}`,
      "dist/http.js",
    ],
    {
      env: { ...process.env, MCP_API_KEY: "test-client-key", ...env },
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
  return new Promise<string>((resolve, reject) => {
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
}

/** Stateless JSON-RPC client: each request repeats its key and, on 2026-07-28, its metadata. */
export function client(endpoint: string, protocolVersion: string) {
  let id = 0;
  const send = (
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
        id: ++id,
        method,
        params: {
          ...params,
          ...(protocolVersion === "2026-07-28"
            ? {
                _meta: {
                  "io.modelcontextprotocol/protocolVersion": protocolVersion,
                  "io.modelcontextprotocol/clientCapabilities": {},
                  "io.modelcontextprotocol/clientInfo": {
                    name: "smoke",
                    version: "1.0.0",
                  },
                },
              }
            : {}),
        },
      }),
    });
  const rpc = async (method: string, params: Record<string, unknown>) => {
    const response = await send(method, params);
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
  return { send, rpc };
}

/** Runs the checks every example shares: auth, discovery, and invalid input. */
export async function commonChecks(
  api: ReturnType<typeof client>,
  protocolVersion: string,
  tools: string[],
  invalidCall: Record<string, unknown>
) {
  assert.equal((await api.send("tools/list", {}, "wrong")).status, 401);
  assert.equal((await api.send("tools/list", {}, "")).status, 401);
  if (protocolVersion === "2025-03-26") {
    const initialized = await api.rpc("initialize", {
      protocolVersion,
      capabilities: {},
      clientInfo: { name: "smoke", version: "1.0.0" },
    });
    assert.ok(initialized.result.capabilities.tools);
  }
  const listed = await api.rpc("tools/list", {});
  assert.deepEqual(
    listed.result.tools.map((tool: { name: string }) => tool.name).sort(),
    [...tools].sort()
  );
  const invalid = await api.rpc("tools/call", invalidCall);
  assert.ok(invalid.error || invalid.result?.isError);
}
