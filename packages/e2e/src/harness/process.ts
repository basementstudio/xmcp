import { spawn } from "node:child_process";
import { appendFileSync } from "node:fs";
import { EventEmitter } from "node:events";
import {
  BUILD_TIMEOUT_MS,
  MAX_CAPTURE_CHARS,
  SHUTDOWN_TIMEOUT_MS,
  STARTUP_TIMEOUT_MS,
} from "./constants.js";

export function startProcess(
  command: string,
  args: string[],
  cwd: string,
  logPath: string
) {
  const child = spawn(command, args, {
    cwd,
    env: {
      ...process.env,
      XMCP_TELEMETRY_DISABLED: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    // A fixture owns its process group, including framework worker processes.
    detached: process.platform !== "win32",
  });
  let output = "";
  let failure: Error | undefined;
  let closed = false;
  const events = new EventEmitter();
  const capture = (chunk: Buffer) => {
    appendFileSync(logPath, chunk);
    output = (output + chunk.toString()).slice(-MAX_CAPTURE_CHARS);
    events.emit("output");
  };
  child.stdout.on("data", capture);
  child.stderr.on("data", capture);
  // Resolve even on failure; callers decide whether an exit was expected.
  const completion = new Promise<number | null>((resolve) => {
    child.once("error", (error) => {
      failure = error;
      events.emit("output");
    });
    child.once("close", (code) => {
      closed = true;
      events.emit("output");
      resolve(code);
    });
  });
  function kill(signal: NodeJS.Signals) {
    if (!child.pid) return;
    try {
      if (process.platform === "win32") child.kill(signal);
      else process.kill(-child.pid, signal);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ESRCH") throw error;
    }
  }
  async function stop() {
    if (closed) return;
    kill("SIGTERM");
    const timer = setTimeout(() => kill("SIGKILL"), SHUTDOWN_TIMEOUT_MS);
    try {
      await completion;
    } finally {
      clearTimeout(timer);
    }
  }
  async function waitForOutput(pattern: RegExp): Promise<RegExpMatchArray> {
    return new Promise((resolve, reject) => {
      const finish = (error?: Error, match?: RegExpMatchArray) => {
        clearTimeout(timer);
        events.off("output", check);
        if (error) reject(error);
        else resolve(match!);
      };
      const check = () => {
        const match = output.match(pattern);
        if (match) finish(undefined, match);
        else if (failure || closed)
          finish(
            new Error(
              `Fixture exited before readiness: ${failure?.message ?? "process closed"}\n${output}`
            )
          );
      };
      const timer = setTimeout(
        () =>
          finish(
            new Error(`Fixture startup timed out. See ${logPath}\n${output}`)
          ),
        STARTUP_TIMEOUT_MS
      );
      events.on("output", check);
      check();
    });
  }
  return {
    completion,
    stop,
    waitForOutput,
    output: () => output,
    error: () => failure,
  };
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string,
  logPath: string
) {
  const running = startProcess(command, args, cwd, logPath);
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void running.stop();
  }, BUILD_TIMEOUT_MS);
  try {
    const code = await running.completion;
    if (timedOut || code !== 0 || running.error()) {
      throw new Error(
        `${command} failed (${timedOut ? "timeout" : code}). See ${logPath}\n${running.error()?.message ?? ""}\n${running.output()}`
      );
    }
  } finally {
    clearTimeout(timer);
    await running.stop();
  }
}
