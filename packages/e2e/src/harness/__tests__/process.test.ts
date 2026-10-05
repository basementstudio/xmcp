import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { runCommand, startProcess } from "../process.js";

test("captures readiness, stops the child, and retains diagnostics", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-process-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const log = join(directory, "server.log");
  const child = startProcess(
    process.execPath,
    [
      "-e",
      'require("node:net").createServer().listen(0, "127.0.0.1", () => console.log("READY"))',
    ],
    directory,
    log
  );
  context.after(() => child.stop());
  await child.waitForOutput(/READY/);
  await child.stop();
  await child.completion;
  assert.match(await readFile(log, "utf8"), /READY/);
});

test("reports early exit and failed builds instead of waiting for readiness", async (context) => {
  const directory = await mkdtemp(join(tmpdir(), "xmcp-process-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const log = join(directory, "failure.log");
  const child = startProcess(
    process.execPath,
    ["-e", 'console.error("startup failed"); process.exit(1)'],
    directory,
    log
  );
  context.after(() => child.stop());
  await assert.rejects(child.waitForOutput(/READY/), /startup failed/);
  await assert.rejects(
    runCommand(
      process.execPath,
      ["-e", 'console.error("build failed"); process.exit(1)'],
      directory,
      log
    ),
    /build failed/
  );
});
