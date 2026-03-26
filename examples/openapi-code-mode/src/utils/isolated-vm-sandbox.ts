import ivm from "isolated-vm";
import type { SandboxOptions, SandboxResult } from "@xmcp-dev/sandbox";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MEMORY_LIMIT = 50; // MB (isolated-vm uses MB, not bytes)

/**
 * Isolated-VM engine: runs agent code in a V8 isolate.
 * Full isolation (separate V8 heap) + full async/await support.
 * Supports chained await, loops with await, Promise.all — no ASYNCIFY limitations.
 */
export async function runInIsolatedVm(
  code: string,
  options: SandboxOptions
): Promise<SandboxResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const memoryLimitMB = options.memoryLimitBytes
    ? Math.ceil(options.memoryLimitBytes / (1024 * 1024))
    : DEFAULT_MEMORY_LIMIT;

  const isolate = new ivm.Isolate({ memoryLimit: memoryLimitMB });
  const context = await isolate.createContext();

  try {
    const jail = context.global;
    await jail.set("global", jail.derefInto());

    // Inject globals
    for (const global of options.globals) {
      if (global.type === "value") {
        const jsonStr =
          typeof global.value === "string"
            ? global.value
            : JSON.stringify(global.value);
        await jail.set(global.name, jsonStr);
      } else if (global.type === "function" && global.fn) {
        const hostFn = global.fn;
        // Create a reference to the host function that the isolate can call
        await jail.set(
          `__host_${global.name}`,
          new ivm.Reference(async (...args: unknown[]) => {
            const result = await hostFn(...args);
            return typeof result === "string" ? result : JSON.stringify(result);
          })
        );
        // Create a JS wrapper inside the isolate that calls the host function
        await context.eval(
          `global.${global.name} = async (...args) => {
            return await __host_${global.name}.applySyncPromise(undefined, args);
          };`,
          { timeout: timeoutMs }
        );
      }
    }

    // Wrap agent code in async IIFE
    const wrappedCode = `
      (async () => {
        try {
          const __val = await (async () => { ${code} })();
          return JSON.stringify({ ok: true, data: __val });
        } catch(e) {
          return JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })()
    `;

    const resultRef = await context.eval(wrappedCode, {
      timeout: timeoutMs,
      promise: true,
    });

    const resultStr =
      typeof resultRef === "string"
        ? resultRef
        : typeof resultRef?.copy === "function"
          ? resultRef.copy()
          : String(resultRef);

    const parsed = JSON.parse(resultStr);
    if (parsed.ok) {
      return { success: true, data: parsed.data };
    } else {
      return { success: false, error: parsed.error };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Script execution timed out")) {
      return {
        success: false,
        error: `Execution timed out after ${timeoutMs}ms`,
      };
    }
    if (message.includes("exceeded")) {
      return { success: false, error: "Memory limit exceeded" };
    }
    return { success: false, error: message };
  } finally {
    context.release();
    isolate.dispose();
  }
}
