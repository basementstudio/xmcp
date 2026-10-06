import { join } from "node:path";
import { E2E_ROOT } from "./fixture.js";
import { startProcess } from "./process.js";

// Leave room within the conformance deadline to stop the CLI and its children.
const CLI_TIMEOUT_MS = 15_000;

export async function runDeveloperCli(
  args: string[],
  cwd: string,
  logName: string
) {
  const running = startProcess(
    process.execPath,
    [join(E2E_ROOT, "../cli/dist/index.js"), ...args],
    cwd,
    join(cwd, `${logName}.log`)
  );
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    void running.stop();
  }, CLI_TIMEOUT_MS);
  try {
    const code = await running.completion;
    if (timedOut || running.error())
      throw new Error(
        `Developer CLI failed: ${running.error()?.message ?? "timeout"}\n${running.output()}`
      );
    return { code, stdout: running.stdout(), stderr: running.stderr() };
  } finally {
    clearTimeout(timer);
    await running.stop();
  }
}
