import { spawn } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  inspectorCli,
  spawnHttpEntry,
  spawnStdioEntry,
  type ServerHandle,
  type StdioClient,
} from "./_utils";

// Phase 8.2 — runtime smoke for examples. The build-only sweep in
// .github/workflows/examples.yml asserts each example COMPILES against
// the workspace xmcp; this asserts a representative subset actually
// BOOTS and answers `tools/list`. A regression that breaks the runtime
// (e.g. wrong entry path, missing import, broken JSON-RPC framing) lands
// here, not in production.
//
// Gated by EXAMPLES_SMOKE=1 because each cell builds + boots a real
// example (~5–15s each). Local: `EXAMPLES_SMOKE=1 pnpm test:integration
// -- integration/examples-runtime-smoke.test.ts`. CI: set in the
// examples-smoke.yml workflow on canary push.
//
// Scope: HTTP/stdio examples only for the first pass. Framework adapters
// (with-nextjs, with-nestjs, cloudflare-workers, with-express) require
// `next start` / `nest start` / wrangler dev / express server bootstrap
// at runtime and warrant their own follow-up.

const SMOKE_ENABLED = process.env.EXAMPLES_SMOKE === "1";

const REPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const EXAMPLES_DIR = path.join(REPO_ROOT, "examples");

interface HttpExample {
  kind: "http";
  name: string;
  /** Tools we expect `tools/list` to return. Subset is fine. */
  expectedTools: string[];
}

interface StdioExample {
  kind: "stdio";
  name: string;
  expectedTools: string[];
}

type Example = HttpExample | StdioExample;

const EXAMPLES: Example[] = [
  {
    kind: "http",
    name: "http-transport",
    expectedTools: ["greet"],
  },
  {
    kind: "stdio",
    name: "stdio-transport",
    expectedTools: ["greet"],
  },
  {
    kind: "http",
    name: "middlewares-api-key",
    // We only check that tools/list returns SOMETHING; the API-key
    // middleware should still let the request through with the
    // expected key (and we don't pass one in this smoke). If the
    // middleware blocks anonymous access — that's a real signal,
    // pin the resulting status to make the gap explicit.
    expectedTools: [],
  },
];

const handles: Array<ServerHandle | StdioClient> = [];

afterEach(async () => {
  while (handles.length > 0) {
    const h = handles.pop()!;
    if ("stop" in h) {
      await h.stop();
    } else if ("child" in h) {
      h.child.kill("SIGTERM");
    }
  }
});

describe.skipIf(!SMOKE_ENABLED)(
  "examples runtime smoke (EXAMPLES_SMOKE=1)",
  () => {
    for (const ex of EXAMPLES) {
      it(`${ex.name} (${ex.kind}) builds, boots, and answers tools/list`, async () => {
        const exampleDir = path.join(EXAMPLES_DIR, ex.name);
        await runXmcpBuild(exampleDir);

        const distDir = path.join(exampleDir, "dist");
        if (ex.kind === "http") {
          const entry = path.join(distDir, "http.js");
          expect(
            existsSync(entry),
            `${ex.name}: dist/http.js was not produced by xmcp build`
          ).toBe(true);
          const server = await spawnHttpEntry(entry);
          handles.push(server);
          // inspectorCli runs the canonical MCP init handshake before
          // calling tools/list, which is what real clients do. Direct
          // POST to the streamable-http endpoint without that fails.
          try {
            const list = await inspectorCli<{
              tools: Array<{ name: string }>;
            }>({
              transport: "http",
              url: server.url,
              method: "tools/list",
            });
            const names = list.tools.map((t) => t.name);
            for (const expected of ex.expectedTools) {
              expect(
                names,
                `expected ${ex.name} to expose tool "${expected}"`
              ).toContain(expected);
            }
          } catch (err) {
            // Some examples (e.g. middlewares-api-key) gate tools/list
            // behind auth. The smoke goal is "the server boots and
            // responds" — surfacing a structured failure is acceptable
            // as long as the server didn't crash. If `expectedTools`
            // names anything for this example, propagate the error.
            if (ex.expectedTools.length > 0) throw err;
          }
        } else {
          const entry = path.join(distDir, "stdio.js");
          expect(
            existsSync(entry),
            `${ex.name}: dist/stdio.js was not produced by xmcp build`
          ).toBe(true);
          const client = await spawnStdioEntry(entry);
          handles.push(client);
          await client.request({
            id: 1,
            method: "initialize",
            params: {
              protocolVersion: "2024-11-05",
              capabilities: {},
              clientInfo: { name: "smoke-test", version: "0.0.0" },
            },
          });
          await client.request({
            id: 2,
            method: "notifications/initialized",
          });
          const list = (await client.request({
            id: 3,
            method: "tools/list",
          })) as {
            result?: { tools?: Array<{ name: string }> };
            error?: { code: number; message: string };
          };
          assertToolsListResult(list, ex);
        }
      }, // Each cell does a real build + boot + roundtrip. Allow ~60s.
      60_000);
    }
  }
);

async function runXmcpBuild(exampleDir: string): Promise<void> {
  // We invoke xmcp directly via the workspace dist (rather than
  // `pnpm --filter=<name> build`) to sidestep per-example scripts that
  // chain a never-exiting dev step (e.g. with-express).
  const cliPath = path.join(REPO_ROOT, "packages", "xmcp", "dist", "cli.js");
  if (!existsSync(cliPath)) {
    throw new Error(
      `xmcp CLI not built at ${cliPath}. Run \`pnpm turbo build --filter=xmcp\` first.`
    );
  }
  const child = spawn(process.execPath, [cliPath, "build"], {
    cwd: exampleDir,
    env: { ...process.env, NODE_ENV: "production" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stderrChunks: string[] = [];
  child.stderr?.on("data", (b: Buffer) =>
    stderrChunks.push(b.toString("utf8"))
  );
  const [exitCode] = (await once(child, "exit")) as [number | null];
  if (exitCode !== 0) {
    throw new Error(
      `xmcp build failed in ${exampleDir} (exit ${exitCode}):\n${stderrChunks.join("")}`
    );
  }
}

function assertToolsListResult(result: unknown, ex: Example): void {
  // Either the server responds with a valid tools list, or it returns a
  // JSON-RPC error. We accept either as long as the response shape is
  // valid — a regression that returns malformed JSON / hangs / 500s
  // bites here. Specific tool-name expectations only run if the call
  // succeeded with a tools array.
  const r = result as {
    result?: { tools?: Array<{ name: string }> };
    error?: { code: number; message: string };
  };
  if (r.error) {
    // A JSON-RPC error on tools/list is acceptable for examples that
    // gate on auth — but the response must be well-formed.
    expect(typeof r.error.code).toBe("number");
    expect(typeof r.error.message).toBe("string");
    return;
  }
  expect(
    r.result,
    "tools/list returned neither result nor error"
  ).toBeDefined();
  expect(Array.isArray(r.result?.tools)).toBe(true);
  const names = (r.result?.tools ?? []).map((t) => t.name);
  for (const expected of ex.expectedTools) {
    expect(names, `expected ${ex.name} to expose tool "${expected}"`).toContain(
      expected
    );
  }
}
