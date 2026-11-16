import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { once } from "node:events";
import { createServer } from "node:net";
import type { AddressInfo } from "node:net";
import { setTimeout as sleep } from "node:timers/promises";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { createDramatiqClient, DramatiqBridgeError } from "@xmcp-dev/dramatiq";

const BRIDGE_DIR = fileURLToPath(new URL("../bridge/", import.meta.url));
const PYTHON = process.env.BRIDGE_PYTHON ?? `${BRIDGE_DIR}.venv/bin/python`;
const REDIS_SERVER = process.env.REDIS_SERVER ?? "redis-server";
const TOKEN = "e2e-bridge-token";

/** Covers process startup plus several worker round trips. */
const TEST_TIMEOUT_MS = 60_000;

/** Dramatiq has no completion notification, so results are polled. */
const POLL_INTERVAL_MS = 100;

/** Retention for the expiry check; the test waits just past it. */
const SHORT_RETENTION_SECONDS = 1;

/** Slack for Redis key expiry after the retention period ends. */
const EXPIRY_MARGIN_MS = 500;

async function freePort() {
  const server = createServer().listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address() as AddressInfo;
  server.close();
  await once(server, "close");
  return port;
}

/** Starts a process and resolves once it logs `ready`. */
async function start(
  context: TestContext,
  command: string,
  args: string[],
  env: Record<string, string>,
  ready: string
): Promise<ChildProcess> {
  const child = spawn(command, args, {
    cwd: BRIDGE_DIR,
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
      await once(child, "exit");
    }
  };
  context.after(stop);
  await new Promise<void>((resolve, reject) => {
    let output = "";
    const onData = (data: Buffer) => {
      output += data;
      if (output.includes(ready)) resolve();
    };
    child.stdout!.on("data", onData);
    child.stderr!.on("data", onData);
    child.once("error", reject);
    child.once("exit", (code) =>
      reject(new Error(`${command} exited (${code}):\n${output}`))
    );
  });
  return child;
}

async function stop(child: ChildProcess) {
  child.kill();
  await once(child, "exit");
}

const available = existsSync(PYTHON);

test(
  "bridge, worker, and Redis: results, failures, expiry, auth, and outages",
  {
    timeout: TEST_TIMEOUT_MS,
    skip: available
      ? false
      : "create bridge/.venv (see README) and install redis-server",
  },
  async (context) => {
    const redisPort = await freePort();
    const redis = await start(
      context,
      REDIS_SERVER,
      ["--port", String(redisPort), "--save", "", "--appendonly", "no"],
      {},
      "Ready to accept connections"
    );
    const env = {
      REDIS_URL: `redis://127.0.0.1:${redisPort}/0`,
      DRAMATIQ_BRIDGE_TOKEN: TOKEN,
      RESULT_RETENTION_SECONDS: "60",
    };
    const worker = await start(
      context,
      PYTHON,
      ["-m", "dramatiq", "actors", "--processes", "1", "--threads", "1"],
      env,
      "Worker process is ready for action."
    );
    const bridgePort = await freePort();
    const startBridge = (
      extra: Record<string, string> = {},
      port = bridgePort
    ) =>
      start(
        context,
        PYTHON,
        [
          "-m",
          "uvicorn",
          "app:app",
          "--host",
          "127.0.0.1",
          "--port",
          String(port),
        ],
        { ...env, ...extra },
        "Uvicorn running"
      );
    let bridge = await startBridge();
    const baseUrl = `http://127.0.0.1:${bridgePort}`;
    const client = createDramatiqClient({ baseUrl, token: TOKEN });
    const settled = async (jobId: string) => {
      while (true) {
        const result = await client.getResult(jobId);
        if (result.status !== "unavailable") return result;
        await sleep(POLL_INTERVAL_MS);
      }
    };
    const post = (body: unknown, token = TOKEN) =>
      fetch(`${baseUrl}/v1/jobs`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

    // Authentication and allowlisting happen before anything is enqueued.
    assert.equal(
      (await post({ actor: "count_words", args: ["a"] }, "x")).status,
      401
    );
    assert.equal(
      (await post({ actor: "os.system", args: ["id"] })).status,
      422
    );
    assert.equal((await post({ actor: "count_words", args: [1] })).status, 422);
    assert.equal(
      (await post({ actor: "count_words", args: ["a"], kwargs: { text: "b" } }))
        .status,
      422
    );

    const { jobId } = await client.enqueue({
      actor: "count_words",
      args: ["one two three"],
    });
    assert.deepEqual(await settled(jobId), {
      status: "succeeded",
      result: { words: 3 },
    });

    // Lookup metadata lives in Redis, so a restarted bridge still finds it.
    await stop(bridge);
    bridge = await startBridge();
    assert.deepEqual(await client.getResult(jobId), {
      status: "succeeded",
      result: { words: 3 },
    });

    const failed = await client.enqueue({
      actor: "count_words",
      kwargs: { text: "   " },
    });
    assert.deepEqual(await settled(failed.jobId), {
      status: "failed",
      error: "Actor execution failed",
    });

    assert.deepEqual(
      await client.getResult("00000000-0000-4000-8000-000000000000"),
      { status: "not_found" }
    );

    // Without a worker the result is unavailable, which is not proof of
    // queued or running work.
    await stop(worker);
    const idle = await client.enqueue({ actor: "count_words", args: ["x"] });
    assert.deepEqual(await client.getResult(idle.jobId), {
      status: "unavailable",
    });

    // Once retention passes, the job can no longer be looked up.
    const shortPort = await freePort();
    await startBridge(
      { RESULT_RETENTION_SECONDS: String(SHORT_RETENTION_SECONDS) },
      shortPort
    );
    const shortClient = createDramatiqClient({
      baseUrl: `http://127.0.0.1:${shortPort}`,
      token: TOKEN,
    });
    const expiring = await shortClient.enqueue({
      actor: "count_words",
      args: ["x"],
    });
    await sleep(SHORT_RETENTION_SECONDS * 1000 + EXPIRY_MARGIN_MS);
    assert.deepEqual(await shortClient.getResult(expiring.jobId), {
      status: "not_found",
    });

    await stop(redis);
    await assert.rejects(
      client.enqueue({ actor: "count_words", args: ["x"] }),
      (error: unknown) =>
        error instanceof DramatiqBridgeError && error.status === 503
    );
    await assert.rejects(
      client.getResult(jobId),
      (error: unknown) =>
        error instanceof DramatiqBridgeError && error.status === 503
    );
  }
);
