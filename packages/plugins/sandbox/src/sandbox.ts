import { Sandbox } from "@vercel/sandbox";
import type {
  SandboxOptions,
  SandboxResult,
  CreateSnapshotOptions,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;

/**
 * Execute JavaScript code in an isolated Vercel Sandbox (Firecracker microVM).
 *
 * - Globals are injected as const variables (string values)
 * - Env vars are injected into process.env (use for secrets)
 * - Agent code has access to fetch() for HTTP calls
 * - Full async/await support (chained awaits, loops, Promise.all)
 * - OS-level isolation (separate filesystem, network, process space)
 * - Always returns SandboxResult, never throws
 */
export async function runInSandbox(
  code: string,
  options?: SandboxOptions
): Promise<SandboxResult> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;

  try {
    // Create VM: from snapshot or fresh
    const baseParams = {
      timeout: timeoutMs + 5000,
      env: options?.env,
      networkPolicy: options?.networkPolicy,
    };

    if (options?.snapshotId) {
      sandbox = await Sandbox.create({
        ...baseParams,
        source: { type: "snapshot" as const, snapshotId: options.snapshotId },
      });
    } else {
      sandbox = await Sandbox.create({
        ...baseParams,
        runtime: "node24" as const,
      });
    }

    // Install packages if requested
    if (options?.packages?.length) {
      const installCmd = await sandbox.runCommand("npm", [
        "install",
        "--no-audit",
        "--no-fund",
        ...options.packages,
      ]);
      if (installCmd.exitCode !== 0) {
        const stderr = await installCmd.stderr();
        return {
          success: false,
          error: `Failed to install packages: ${stderr}`,
        };
      }
    }

    // Build script: declare globals as const + wrap agent code in async IIFE
    const globalsCode = Object.entries(options?.globals ?? {})
      .map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`)
      .join("\n");

    const script = `
${globalsCode}
(async () => {
  try {
    const __result = await (async () => { ${code} })();
    process.stdout.write(JSON.stringify({ ok: true, data: __result }));
  } catch (e) {
    process.stdout.write(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
  }
})();
`;

    await sandbox.writeFiles([
      { path: "/tmp/run.js", content: Buffer.from(script) },
    ]);

    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeoutMs);

    let cmd;
    try {
      cmd = await sandbox.runCommand("node", ["/tmp/run.js"], {
        signal: abortController.signal,
      });
    } finally {
      clearTimeout(timer);
    }

    if (cmd.exitCode !== 0) {
      const stderr = await cmd.stderr();
      return {
        success: false,
        error: stderr || `Process exited with code ${cmd.exitCode}`,
      };
    }

    const stdout = await cmd.stdout();
    if (!stdout.trim()) {
      return { success: true, data: undefined };
    }

    const parsed = JSON.parse(stdout);
    return parsed.ok
      ? { success: true, data: parsed.data }
      : { success: false, error: parsed.error };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    if (
      message.includes("unauthorized") ||
      message.includes("OIDC") ||
      message.includes("credentials") ||
      message.includes("401")
    ) {
      return {
        success: false,
        error:
          "Vercel Sandbox requires authentication. Run 'vercel link' and 'vercel env pull' for local development.",
      };
    }

    if (message.includes("abort") || message.includes("timeout")) {
      return {
        success: false,
        error: `Execution timed out after ${timeoutMs}ms`,
      };
    }

    return { success: false, error: message };
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Create a reusable snapshot with pre-installed packages.
 * Use the returned snapshotId in runInSandbox({ snapshotId }) for faster execution.
 *
 * Snapshots expire after 30 days by default on Vercel.
 */
export async function createSnapshot(
  options?: CreateSnapshotOptions
): Promise<string> {
  const sandbox = await Sandbox.create({ runtime: "node24" });

  try {
    if (options?.packages?.length) {
      const installCmd = await sandbox.runCommand("npm", [
        "install",
        "--no-audit",
        "--no-fund",
        ...options.packages,
      ]);
      if (installCmd.exitCode !== 0) {
        const stderr = await installCmd.stderr();
        throw new Error(`Failed to install packages: ${stderr}`);
      }
    }

    const snapshot = await sandbox.snapshot();
    return snapshot.snapshotId;
  } catch (err) {
    // Ensure sandbox is stopped even if snapshot fails
    try {
      await sandbox.stop();
    } catch {
      // Ignore
    }
    throw err;
  }
}
