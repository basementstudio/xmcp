import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import os from "node:os";
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

// Hard ceiling for `xmcp dev` to chokidar-ready + first rspack build. 30s
// covers cold CI runners that are also installing transitive deps elsewhere.
const WATCHER_FIRST_BUILD_TIMEOUT_MS = 30_000;

// Hard ceiling for a single incremental rebuild triggered by a file event.
// 15s is well above the ~200–600ms typical rebuild and short enough to fail
// fast when chokidar misses an event (which is the regression we test for).
const WATCHER_REBUILD_TIMEOUT_MS = 15_000;

// Hard ceiling for one mcpjam CLI round-trip (spawn → connect → request →
// reply → disconnect). 30s covers cold node start + connect handshake on CI.
const MCPJAM_CLI_TIMEOUT_MS = 30_000;

// Resolve the mcpjam CLI entry via node module lookup so it works whether
// the package is hoisted to the workspace root or installed locally under
// packages/xmcp/node_modules/. mcpjam's package.json declares `bin.mcpjam =
// dist/index.js`; we resolve that path and spawn it directly with node so we
// don't pay the npx download cost on every test.
const MCPJAM_CLI_ENTRY = (() => {
  const pkgJsonPath = createRequire(__filename).resolve(
    "@mcpjam/cli/package.json"
  );
  return path.join(path.dirname(pkgJsonPath), "dist", "index.js");
})();

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

// Sorted, POSIX-style relative file list for vitest `toMatchSnapshot()`. Pins
// the file tree of a build output dir so accidental additions/removals/renames
// (new chunk, dropped runtime helper, renamed entry) get caught by snapshot
// diff. Update with `pnpm test -u` when the change is intentional.
export async function snapshotFileTree(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, {
    recursive: true,
    withFileTypes: true,
  });
  return entries
    .filter((e) => e.isFile())
    .map((e) =>
      path
        .relative(rootDir, path.join(e.parentPath ?? e.path, e.name))
        .split(path.sep)
        .join("/")
    )
    .sort();
}

function ensureCliBuilt(): void {
  if (!existsSync(CLI_PATH)) {
    throw new Error(
      `xmcp CLI not built at ${CLI_PATH}. Run \`pnpm build\` from the xmcp package first.`
    );
  }
}

export interface BuildFixtureOptions {
  /**
   * Extra CLI args appended after `build` (e.g. `["--vercel"]`, `["--cf"]`).
   * The default is no flags — a plain production build of the fixture.
   */
  args?: string[];
  /**
   * Extra paths under the fixture directory to clean before building.
   * `dist` is always cleaned. Use this for adapter outputs like `.vercel`.
   */
  cleanPaths?: string[];
  /**
   * Environment for the spawned build process. Defaults to `process.env`.
   * Tests that build generated/untrusted fixtures can pass a scrubbed env.
   */
  env?: NodeJS.ProcessEnv;
}

export async function buildFixture(
  name: string,
  options: BuildFixtureOptions = {}
): Promise<BuildResult> {
  return buildAt(fixturePath(name), options);
}

export interface RunCliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

/**
 * Spawn the built CLI with arbitrary args. Used by argv-parsing tests
 * that just want the exit code and the captured streams — no fixture,
 * no build cleanup, no cwd. Caller may set `cwd` for commands that read
 * config from a directory (e.g. `xmcp build` would, but `--help` won't).
 */
export async function runCli(
  args: string[],
  options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
): Promise<RunCliResult> {
  ensureCliBuilt();
  const child = spawn(process.execPath, [CLI_PATH, ...args], {
    cwd: options.cwd ?? PACKAGE_ROOT,
    env: { ...process.env, ...(options.env ?? {}) },
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
    exitCode: exitCode ?? -1,
    stdout: stdoutChunks.join(""),
    stderr: stderrChunks.join(""),
  };
}

/**
 * Run `xmcp build` against an absolute directory. Used by error-path tests
 * that stage a fixture into a tempdir and mutate it before building.
 */
export async function buildAt(
  fixtureDir: string,
  options: BuildFixtureOptions = {}
): Promise<BuildResult> {
  ensureCliBuilt();
  const distDir = path.join(fixtureDir, "dist");
  await fs.rm(distDir, { recursive: true, force: true });
  for (const extra of options.cleanPaths ?? []) {
    await fs.rm(path.join(fixtureDir, extra), {
      recursive: true,
      force: true,
    });
  }

  const child = spawn(
    process.execPath,
    [CLI_PATH, "build", ...(options.args ?? [])],
    {
      cwd: fixtureDir,
      env: { ...(options.env ?? process.env), NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

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
  return spawnHttpEntry(httpEntry, options);
}

/**
 * Spawn an HTTP server from an absolute `dist/http.js`-style entry. Used
 * by example-runtime-smoke tests that build under examples/<name>/dist
 * rather than test/fixtures/<name>/dist.
 */
export async function spawnHttpEntry(
  entryPath: string,
  options: SpawnHttpOptions = {}
): Promise<ServerHandle> {
  if (!existsSync(entryPath)) {
    throw new Error(`HTTP entry not found: ${entryPath}`);
  }

  const startPort = options.startPort ?? (await findFreePort());
  const endpoint = options.endpoint ?? "/mcp";

  const child = spawn(process.execPath, [entryPath], {
    cwd: path.dirname(entryPath),
    env: {
      ...(options.env ?? process.env),
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
  let stderr = "";
  return new Promise<number>((resolve, reject) => {
    const onExit = (code: number | null) => {
      reject(
        new Error(
          `Server exited with code ${code} before reporting a bound port.\nstdout:\n${buffer}\nstderr:\n${stderr}`
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
    const onStderr = (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    };
    child.stdout.on("data", onData);
    child.stderr?.on("data", onStderr);
    child.once("exit", onExit);
    setTimeout(() => {
      child.stdout?.off("data", onData);
      child.stderr?.off("data", onStderr);
      child.off("exit", onExit);
      reject(
        new Error(
          `Server did not report a bound port within ${SERVER_STARTUP_TIMEOUT_MS}ms.\nstdout:\n${buffer}\nstderr:\n${stderr}`
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
  return spawnStdioEntry(entry);
}

/**
 * Spawn the stdio entry from an absolute `dist/stdio.js` path. Used by
 * example-runtime-smoke tests.
 */
export async function spawnStdioEntry(entryPath: string): Promise<StdioClient> {
  if (!existsSync(entryPath)) {
    throw new Error(`stdio entry not found: ${entryPath}`);
  }

  const child = spawn(process.execPath, [entryPath], {
    cwd: path.dirname(entryPath),
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

export interface DevServerHandle {
  child: ChildProcess;
  tempDir: string;
  /**
   * Resolve when the next successful rebuild after this call completes.
   * Each invocation waits for one fresh "Compiled in" line on stdout.
   */
  waitForRebuild(): Promise<void>;
  /** Joined stdout collected since spawn — surfaced in failure messages. */
  stdout(): string;
  stop(): Promise<void>;
}

export interface SpawnDevOptions {
  /** Reuse an existing temp dir (e.g. for restart tests). */
  tempDir?: string;
}

/**
 * Spawn `xmcp dev` against an isolated copy of a fixture and return a handle
 * that lets tests await the next successful rebuild. The first build is
 * awaited inline so callers always get a ready watcher.
 */
export async function spawnDevServer(
  fixtureName: string,
  options: SpawnDevOptions = {}
): Promise<DevServerHandle> {
  ensureCliBuilt();
  const tempDir = options.tempDir ?? (await prepareDevTempDir(fixtureName));

  const child = spawn(process.execPath, [CLI_PATH, "dev"], {
    cwd: tempDir,
    env: { ...process.env, NODE_ENV: "development" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  let buildCount = 0;
  type Waiter = {
    target: number;
    resolve: () => void;
    reject: (err: Error) => void;
    timer: NodeJS.Timeout;
  };
  const waiters: Waiter[] = [];
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];
  let pendingLine = "";

  const flushWaiters = () => {
    for (let i = waiters.length - 1; i >= 0; i--) {
      const w = waiters[i]!;
      if (buildCount >= w.target) {
        clearTimeout(w.timer);
        waiters.splice(i, 1);
        w.resolve();
      }
    }
  };

  const onLine = (line: string) => {
    if (line.includes("Compiled in")) {
      buildCount += 1;
      flushWaiters();
    }
  };

  child.stdout!.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    stdoutChunks.push(text);
    pendingLine += text;
    let nl: number;
    while ((nl = pendingLine.indexOf("\n")) >= 0) {
      onLine(pendingLine.slice(0, nl));
      pendingLine = pendingLine.slice(nl + 1);
    }
  });
  child.stderr!.on("data", (chunk: Buffer) => {
    stderrChunks.push(chunk.toString("utf8"));
  });

  child.on("exit", (code, signal) => {
    if (waiters.length === 0) return;
    const why = `xmcp dev exited (code=${code} signal=${signal ?? "none"}) before the awaited rebuild.\nstdout:\n${stdoutChunks.join("")}stderr:\n${stderrChunks.join("")}`;
    for (const w of waiters.splice(0)) {
      clearTimeout(w.timer);
      w.reject(new Error(why));
    }
  });

  const awaitBuild = (target: number, timeoutMs: number) =>
    new Promise<void>((resolve, reject) => {
      if (buildCount >= target) {
        resolve();
        return;
      }
      const timer = setTimeout(() => {
        const idx = waiters.findIndex((w) => w.timer === timer);
        if (idx >= 0) waiters.splice(idx, 1);
        reject(
          new Error(
            `xmcp dev did not reach build #${target} within ${timeoutMs}ms (current: ${buildCount}).\nstdout:\n${stdoutChunks.join("")}stderr:\n${stderrChunks.join("")}`
          )
        );
      }, timeoutMs);
      timer.unref();
      waiters.push({ target, resolve, reject, timer });
    });

  await awaitBuild(1, WATCHER_FIRST_BUILD_TIMEOUT_MS);

  return {
    child,
    tempDir,
    stdout: () => stdoutChunks.join(""),
    waitForRebuild() {
      return awaitBuild(buildCount + 1, WATCHER_REBUILD_TIMEOUT_MS);
    },
    async stop() {
      if (child.exitCode !== null || child.signalCode !== null) return;
      const exited = once(child, "exit");
      child.kill("SIGTERM");
      const sigkillTimer = setTimeout(() => {
        if (child.exitCode === null && child.signalCode === null) {
          child.kill("SIGKILL");
        }
      }, SIGTERM_GRACE_MS);
      sigkillTimer.unref();
      try {
        await exited;
      } finally {
        clearTimeout(sigkillTimer);
      }
    },
  };
}

/**
 * Copy a fixture into a fresh tempdir and rewire its node_modules so the
 * symlinks (which are workspace-relative in the original location) resolve
 * absolutely from the new path. Public so error-path tests can mutate a
 * staged copy without touching the source fixture.
 */
export async function stageFixture(fixtureName: string): Promise<string> {
  return prepareDevTempDir(fixtureName);
}

async function prepareDevTempDir(fixtureName: string): Promise<string> {
  const src = fixturePath(fixtureName);
  const tempDir = await fs.mkdtemp(
    path.join(os.tmpdir(), `xmcp-dev-${fixtureName}-`)
  );

  await fs.cp(src, tempDir, {
    recursive: true,
    filter: (entry) => {
      const base = path.basename(entry);
      return base !== "node_modules" && base !== "dist" && base !== ".xmcp";
    },
  });

  const srcNodeModules = path.join(src, "node_modules");
  if (existsSync(srcNodeModules)) {
    const destNodeModules = path.join(tempDir, "node_modules");
    await fs.mkdir(destNodeModules, { recursive: true });
    for (const entry of await fs.readdir(srcNodeModules, {
      withFileTypes: true,
    })) {
      const srcEntry = path.join(srcNodeModules, entry.name);
      const destEntry = path.join(destNodeModules, entry.name);
      const stat = await fs.lstat(srcEntry);
      if (stat.isSymbolicLink()) {
        const linkTarget = await fs.readlink(srcEntry);
        const absoluteTarget = path.resolve(srcNodeModules, linkTarget);
        await fs.symlink(absoluteTarget, destEntry);
      } else if (stat.isDirectory()) {
        // Symlink rather than deep-copy — fixtures share the workspace's
        // hoisted dependencies and we don't want to duplicate them.
        await fs.symlink(srcEntry, destEntry);
      }
    }
  }

  return tempDir;
}

export type McpjamTarget =
  | { transport: "stdio"; command: string; args?: string[]; cwd?: string }
  | { transport: "http"; url: string; headers?: Record<string, string> };

export interface McpjamRunOptions {
  /** Override the default 30s timeout for slow targets. */
  timeoutMs?: number;
  /**
   * Environment for the mcpjam process and any stdio server it spawns.
   * Defaults to `process.env`.
   */
  env?: NodeJS.ProcessEnv;
}

interface McpjamSpawnOptions extends McpjamRunOptions {
  subcommand: string[];
  extraArgs?: string[];
  target: McpjamTarget;
}

/**
 * Drive an MCP server through `@mcpjam/cli` and return the parsed JSON
 * payload it prints on stdout. Replaces the legacy inspector wrapper —
 * mcpjam exits non-zero on failure (no marker scan needed) and emits
 * structured JSON for every subcommand under `--format json --quiet`.
 *
 * Stderr is allowed to contain advisory warnings (e.g. "server does not
 * advertise resources capability"); we only fail on non-zero exit or
 * unparseable stdout.
 */
async function runMcpjam<T = unknown>(options: McpjamSpawnOptions): Promise<T> {
  const args = [
    MCPJAM_CLI_ENTRY,
    "--format",
    "json",
    "--quiet",
    "--no-telemetry",
    ...options.subcommand,
    ...(options.extraArgs ?? []),
  ];

  if (options.target.transport === "stdio") {
    args.push("--transport", "stdio", "--command", options.target.command);
    if (options.target.args && options.target.args.length > 0) {
      args.push("--args", ...options.target.args);
    }
  } else {
    args.push("--transport", "http", "--url", options.target.url);
    if (options.target.headers) {
      for (const [k, v] of Object.entries(options.target.headers)) {
        args.push("--header", `${k}: ${v}`);
      }
    }
  }

  const child = spawn(process.execPath, args, {
    cwd:
      options.target.transport === "stdio"
        ? (options.target.cwd ?? process.cwd())
        : process.cwd(),
    env: options.env ?? process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout!.on("data", (b: Buffer) => (stdout += b.toString("utf8")));
  child.stderr!.on("data", (b: Buffer) => (stderr += b.toString("utf8")));

  const timeoutMs = options.timeoutMs ?? MCPJAM_CLI_TIMEOUT_MS;
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    child.kill("SIGKILL");
  }, timeoutMs);
  timer.unref();
  let exitCode: number | null = null;
  try {
    [exitCode] = (await once(child, "exit")) as [number | null];
  } finally {
    clearTimeout(timer);
  }

  const label = options.subcommand.join(" ");

  if (timedOut) {
    throw new Error(
      `mcpjam ${label} timed out after ${timeoutMs}ms.\nstdout:\n${stdout}\nstderr:\n${stderr}`
    );
  }

  const parsed = extractTrailingJson(stdout);
  if (exitCode !== 0) {
    const detail =
      parsed && typeof parsed === "object" && "error" in (parsed as object)
        ? JSON.stringify((parsed as { error: unknown }).error)
        : stderr.trim() || "(no stderr)";
    throw new Error(
      `mcpjam ${label} exited ${exitCode}: ${detail}\nstdout:\n${stdout}`
    );
  }

  if (parsed === undefined) {
    throw new Error(
      `mcpjam ${label} produced no parseable JSON.\nstdout:\n${stdout}\nstderr:\n${stderr}`
    );
  }
  return parsed as T;
}

export interface McpjamDoctorReport {
  status: "ready" | "failed" | string;
  connection: { status: string; detail?: string };
  capabilities: Record<string, unknown>;
  tools: Array<{ name: string; description?: string }>;
  resources: Array<{ uri: string; name?: string }>;
  prompts: Array<{ name: string; description?: string }>;
  checks: Record<string, { status: string; detail?: string }>;
  error: unknown;
}

export interface McpjamToolsListResult {
  tools: Array<{ name: string; description?: string }>;
}

export interface McpjamToolCallResult {
  content: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

export interface McpjamResourcesListResult {
  resources: Array<{ uri: string; name?: string }>;
}

export interface McpjamResourceReadResult {
  content: {
    contents: Array<{ uri: string; mimeType?: string; text?: string }>;
  };
}

export interface McpjamPromptsListResult {
  prompts: Array<{ name: string; description?: string }>;
}

export interface McpjamPromptGetResult {
  content: {
    description?: string;
    messages: Array<{ role: string; content: { type: string; text?: string } }>;
  };
}

export function mcpjamDoctor(
  target: McpjamTarget,
  options: McpjamRunOptions = {}
): Promise<McpjamDoctorReport> {
  return runMcpjam<McpjamDoctorReport>({
    subcommand: ["server", "doctor"],
    target,
    ...options,
  });
}

export function mcpjamToolsList(
  target: McpjamTarget,
  options: McpjamRunOptions = {}
): Promise<McpjamToolsListResult> {
  return runMcpjam<McpjamToolsListResult>({
    subcommand: ["tools", "list"],
    target,
    ...options,
  });
}

export function mcpjamToolsCall(
  target: McpjamTarget,
  toolName: string,
  toolArgs: Record<string, unknown> = {},
  options: McpjamRunOptions = {}
): Promise<McpjamToolCallResult> {
  return runMcpjam<McpjamToolCallResult>({
    subcommand: ["tools", "call"],
    extraArgs: [
      "--tool-name",
      toolName,
      "--tool-args",
      JSON.stringify(toolArgs),
    ],
    target,
    ...options,
  });
}

export function mcpjamResourcesList(
  target: McpjamTarget,
  options: McpjamRunOptions = {}
): Promise<McpjamResourcesListResult> {
  return runMcpjam<McpjamResourcesListResult>({
    subcommand: ["resources", "list"],
    target,
    ...options,
  });
}

export function mcpjamResourceRead(
  target: McpjamTarget,
  uri: string,
  options: McpjamRunOptions = {}
): Promise<McpjamResourceReadResult> {
  return runMcpjam<McpjamResourceReadResult>({
    subcommand: ["resources", "read"],
    extraArgs: ["--resource-uri", uri],
    target,
    ...options,
  });
}

export function mcpjamPromptsList(
  target: McpjamTarget,
  options: McpjamRunOptions = {}
): Promise<McpjamPromptsListResult> {
  return runMcpjam<McpjamPromptsListResult>({
    subcommand: ["prompts", "list"],
    target,
    ...options,
  });
}

export function mcpjamPromptGet(
  target: McpjamTarget,
  promptName: string,
  promptArgs: Record<string, unknown> = {},
  options: McpjamRunOptions = {}
): Promise<McpjamPromptGetResult> {
  return runMcpjam<McpjamPromptGetResult>({
    subcommand: ["prompts", "get"],
    extraArgs: [
      "--prompt-name",
      promptName,
      "--prompt-args",
      JSON.stringify(promptArgs),
    ],
    target,
    ...options,
  });
}

/** Build a stdio target pointing at a fixture's built dist/stdio.js entry. */
export function mcpjamStdioTarget(fixtureName: string): McpjamTarget {
  const entry = path.join(fixturePath(fixtureName), "dist", "stdio.js");
  return {
    transport: "stdio",
    command: process.execPath,
    args: [entry],
  };
}

function extractTrailingJson(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed);
  } catch {
    // Walk backwards for the last top-level `{...}` block.
    const end = trimmed.lastIndexOf("}");
    if (end === -1) return undefined;
    let depth = 0;
    for (let i = end; i >= 0; i--) {
      const ch = trimmed[i];
      if (ch === "}") depth += 1;
      else if (ch === "{") {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(trimmed.slice(i, end + 1));
          } catch {
            return undefined;
          }
        }
      }
    }
    return undefined;
  }
}
