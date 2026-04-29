import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import path from "node:path";
import fs from "node:fs/promises";
import { existsSync } from "node:fs";

const PACKAGE_ROOT = path.resolve(__dirname, "..", "..");
const FIXTURES_DIR = path.join(PACKAGE_ROOT, "test", "fixtures");
const CLI_PATH = path.join(PACKAGE_ROOT, "dist", "cli.js");

// Grace window for SIGTERM → SIGKILL during test cleanup. 5s lets the http
// and stdio entries flush in-flight responses without dragging the suite out.
const SIGTERM_GRACE_MS = 5_000;

// Hard ceiling for the http server to print its `running on http://…:PORT`
// startup line. 20s covers cold starts on shared CI runners.
const SERVER_STARTUP_TIMEOUT_MS = 20_000;

// Hard ceiling for a single JSON-RPC reply over stdio. 10s is well above any
// real round-trip and short enough to fail fast when the server hangs.
const STDIO_REQUEST_TIMEOUT_MS = 10_000;

export interface ServerHandle {
  child: ChildProcess;
  port: number;
  url: string;
  stop(): Promise<void>;
}

export interface BuildResult {
  fixtureDir: string;
  distDir: string;
  stdoutChunks: string[];
  stderrChunks: string[];
  exitCode: number;
}

export async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const addr = srv.address();
      if (addr && typeof addr === "object") {
        const port = addr.port;
        srv.close(() => resolve(port));
      } else {
        srv.close();
        reject(new Error("Could not get free port"));
      }
    });
  });
}

export function fixturePath(name: string): string {
  return path.join(FIXTURES_DIR, name);
}

function ensureCliBuilt(): void {
  if (!existsSync(CLI_PATH)) {
    throw new Error(
      `xmcp CLI not built at ${CLI_PATH}. Run \`pnpm build\` from the xmcp package first.`
    );
  }
}

export async function buildFixture(name: string): Promise<BuildResult> {
  ensureCliBuilt();
  const fixtureDir = fixturePath(name);
  const distDir = path.join(fixtureDir, "dist");
  await fs.rm(distDir, { recursive: true, force: true });

  const child = spawn(process.execPath, [CLI_PATH, "build"], {
    cwd: fixtureDir,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  child.stdout?.on("data", (b: Buffer) =>
    stdoutChunks.push(b.toString("utf8"))
  );
  child.stderr?.on("data", (b: Buffer) =>
    stderrChunks.push(b.toString("utf8"))
  );

  const [exitCode] = (await once(child, "exit")) as [number | null];

  return {
    fixtureDir,
    distDir,
    stdoutChunks,
    stderrChunks,
    exitCode: exitCode ?? -1,
  };
}

export interface SpawnHttpOptions {
  startPort?: number;
  env?: NodeJS.ProcessEnv;
  endpoint?: string;
}

export async function spawnHttpServer(
  fixtureName: string,
  options: SpawnHttpOptions = {}
): Promise<ServerHandle> {
  const distDir = path.join(fixturePath(fixtureName), "dist");
  const httpEntry = path.join(distDir, "http.js");
  if (!existsSync(httpEntry)) {
    throw new Error(
      `Fixture not built: ${httpEntry} missing. Call buildFixture("${fixtureName}") first.`
    );
  }

  const startPort = options.startPort ?? (await findFreePort());
  const endpoint = options.endpoint ?? "/mcp";

  const child = spawn(process.execPath, [httpEntry], {
    cwd: distDir,
    env: {
      ...process.env,
      ...options.env,
      PORT: String(startPort),
      HOST: "127.0.0.1",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  // The runtime uses findAvailablePort, so the actual bound port may differ
  // from the requested startPort. Parse the startup line to learn it.
  const port = await readBoundPort(child);
  const url = `http://127.0.0.1:${port}${endpoint}`;

  return {
    child,
    port,
    url,
    async stop() {
      if (child.exitCode !== null) return;
      child.kill("SIGTERM");
      await Promise.race([
        once(child, "exit"),
        new Promise((resolve) => setTimeout(resolve, SIGTERM_GRACE_MS)),
      ]);
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    },
  };
}

async function readBoundPort(child: ChildProcess): Promise<number> {
  if (!child.stdout) {
    throw new Error("Server child process has no stdout");
  }
  const re = /running on http:\/\/[^:]+:(\d+)/;
  let buffer = "";
  return new Promise<number>((resolve, reject) => {
    const onExit = (code: number | null) => {
      reject(
        new Error(
          `Server exited with code ${code} before reporting a bound port. Output:\n${buffer}`
        )
      );
    };
    const onData = (chunk: Buffer) => {
      buffer += chunk.toString("utf8");
      const m = buffer.match(re);
      if (m) {
        child.stdout?.off("data", onData);
        child.off("exit", onExit);
        resolve(parseInt(m[1]!, 10));
      }
    };
    child.stdout.on("data", onData);
    child.once("exit", onExit);
    setTimeout(() => {
      child.stdout?.off("data", onData);
      child.off("exit", onExit);
      reject(
        new Error(
          `Server did not report a bound port within ${SERVER_STARTUP_TIMEOUT_MS}ms. Output:\n${buffer}`
        )
      );
    }, SERVER_STARTUP_TIMEOUT_MS).unref();
  });
}

export async function postJsonRpc(
  url: string,
  body: unknown,
  init: RequestInit = {}
): Promise<{ status: number; headers: Headers; body: unknown }> {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...((init.headers as Record<string, string> | undefined) ?? {}),
    },
    body: JSON.stringify(body),
    ...init,
  });
  const text = await res.text();
  let parsed: unknown = text;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    // SSE / streamed response — keep as text
  }
  return { status: res.status, headers: res.headers, body: parsed };
}

export interface StdioClient {
  child: ChildProcess;
  request(message: {
    id: number | string;
    method: string;
    params?: unknown;
  }): Promise<{
    jsonrpc: "2.0";
    id: number | string;
    result?: unknown;
    error?: { code: number; message: string; data?: unknown };
  }>;
  notify(message: { method: string; params?: unknown }): void;
  stop(): Promise<void>;
}

/**
 * Spawn the built stdio entry of a fixture and return a typed client that
 * speaks newline-delimited JSON-RPC over stdin/stdout. Responses are
 * matched to requests by id.
 */
export async function spawnStdioClient(
  fixtureName: string
): Promise<StdioClient> {
  const distDir = path.join(fixturePath(fixtureName), "dist");
  const entry = path.join(distDir, "stdio.js");
  if (!existsSync(entry)) {
    throw new Error(
      `Fixture not built: ${entry} missing. Call buildFixture("${fixtureName}") first.`
    );
  }

  const child = spawn(process.execPath, [entry], {
    cwd: distDir,
    env: process.env,
    stdio: ["pipe", "pipe", "pipe"],
  });

  const pending = new Map<
    number | string,
    { resolve: (value: any) => void; reject: (err: Error) => void }
  >();
  let buffer = "";

  child.stdout!.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    let nl: number;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!.resolve(msg);
          pending.delete(msg.id);
        }
      } catch {
        // Ignore non-JSON lines (e.g. log output).
      }
    }
  });

  child.on("exit", (code) => {
    for (const { reject } of pending.values()) {
      reject(
        new Error(`stdio server exited with code ${code} before responding`)
      );
    }
    pending.clear();
  });

  return {
    child,
    request(message) {
      return new Promise((resolve, reject) => {
        pending.set(message.id, { resolve, reject });
        const timer = setTimeout(() => {
          if (pending.has(message.id)) {
            pending.delete(message.id);
            reject(
              new Error(
                `stdio request id=${message.id} method=${message.method} timed out after ${STDIO_REQUEST_TIMEOUT_MS}ms`
              )
            );
          }
        }, STDIO_REQUEST_TIMEOUT_MS);
        timer.unref();
        child.stdin!.write(
          JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n"
        );
      });
    },
    notify(message) {
      child.stdin!.write(JSON.stringify({ jsonrpc: "2.0", ...message }) + "\n");
    },
    async stop() {
      if (child.exitCode !== null) return;
      child.stdin!.end();
      child.kill("SIGTERM");
      await Promise.race([
        once(child, "exit"),
        new Promise((resolve) => setTimeout(resolve, SIGTERM_GRACE_MS)),
      ]);
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
    },
  };
}
