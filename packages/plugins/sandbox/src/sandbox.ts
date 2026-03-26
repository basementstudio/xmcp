import {
  newAsyncContext,
  shouldInterruptAfterDeadline,
} from "quickjs-emscripten";
import type { QuickJSAsyncContext, QuickJSAsyncRuntime } from "quickjs-emscripten";
import type { SandboxOptions, SandboxResult } from "./types.js";

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MEMORY_LIMIT = 50 * 1024 * 1024; // 50MB
const DEFAULT_STACK_SIZE = 512 * 1024; // 512KB

/**
 * Execute JavaScript code in a sandbox.
 *
 * Two engines available:
 * - "quickjs" (default): Full WASM isolation via QuickJS. Best for data-only code. Single await only.
 * - "host": Runs on Node.js with scoped parameters via AsyncFunction. Full async/chaining support. Weaker isolation.
 *
 * Always returns SandboxResult, never throws.
 */
export async function runInSandbox(
  code: string,
  options: SandboxOptions
): Promise<SandboxResult> {
  const engine = options.engine ?? "quickjs";

  if (engine === "host") {
    return runOnHost(code, options);
  }
  return runInQuickJS(code, options);
}

/**
 * Host engine: runs agent code via AsyncFunction with scoped parameters.
 * Supports multiple await/chaining. Globals are passed as function parameters.
 * No WASM isolation — agent code can only access injected globals.
 */
async function runOnHost(
  code: string,
  options: SandboxOptions
): Promise<SandboxResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  try {
    const paramNames: string[] = [];
    const paramValues: unknown[] = [];

    for (const global of options.globals) {
      paramNames.push(global.name);
      if (global.type === "value") {
        // Pass values as JSON strings (same convention as quickjs engine)
        paramValues.push(
          typeof global.value === "string"
            ? global.value
            : JSON.stringify(global.value)
        );
      } else if (global.type === "function" && global.fn) {
        paramValues.push(global.fn);
      }
    }

    const AsyncFunction = Object.getPrototypeOf(
      async function () {}
    ).constructor;
    const fn = new AsyncFunction(...paramNames, code);

    const result = await Promise.race([
      fn(...paramValues),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Execution timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);

    return { success: true, data: result };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * QuickJS engine: runs agent code in an isolated WASM sandbox.
 * Full isolation (no filesystem, network, Node.js globals).
 * Limitation: only supports a single await on host functions (ASYNCIFY constraint).
 */
async function runInQuickJS(
  code: string,
  options: SandboxOptions
): Promise<SandboxResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const memoryLimit = options.memoryLimitBytes ?? DEFAULT_MEMORY_LIMIT;

  let context: QuickJSAsyncContext | null = null;
  let runtime: QuickJSAsyncRuntime | null = null;

  try {
    context = await newAsyncContext();
    runtime = context.runtime;

    // Set resource limits
    runtime.setMemoryLimit(memoryLimit);
    runtime.setMaxStackSize(DEFAULT_STACK_SIZE);
    runtime.setInterruptHandler(
      shouldInterruptAfterDeadline(Date.now() + timeoutMs)
    );

    // Inject globals
    for (const global of options.globals) {
      if (global.type === "value") {
        const jsonStr =
          typeof global.value === "string"
            ? global.value
            : JSON.stringify(global.value);
        const handle = context.newString(jsonStr);
        context.setProp(context.global, global.name, handle);
        handle.dispose();
      } else if (global.type === "function" && global.fn) {
        const hostFn = global.fn;
        const fnHandle = context.newAsyncifiedFunction(
          global.name,
          async (...args) => {
            const jsArgs = args.map((arg) => context!.dump(arg));
            const result = await hostFn(...jsArgs);
            const resultStr =
              typeof result === "string" ? result : JSON.stringify(result);
            return context!.newString(resultStr);
          }
        );
        context.setProp(context.global, global.name, fnHandle);
        fnHandle.dispose();
      }
    }

    const hasFunctionGlobals = options.globals.some(
      (g) => g.type === "function"
    );

    // Wrap agent code: async IIFE serializes result into __output global
    const wrappedCode = `
      (async () => {
        try {
          const __val = await (async () => { ${code} })();
          globalThis.__output = JSON.stringify({ ok: true, data: __val });
        } catch(e) {
          globalThis.__output = JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      })()
    `;

    if (hasFunctionGlobals) {
      const evalResult = await context.evalCodeAsync(wrappedCode);
      if (evalResult.error) {
        const errorValue = context.dump(evalResult.error);
        evalResult.error.dispose();
        const errorMsg =
          typeof errorValue === "object" && errorValue !== null
            ? (errorValue as any).message || JSON.stringify(errorValue)
            : String(errorValue);
        return { success: false, error: errorMsg };
      }
      evalResult.value.dispose();
      runtime.executePendingJobs();
    } else {
      const evalResult = context.evalCode(wrappedCode);
      if (evalResult.error) {
        const errorValue = context.dump(evalResult.error);
        evalResult.error.dispose();
        const errorMsg =
          typeof errorValue === "object" && errorValue !== null
            ? (errorValue as any).message || JSON.stringify(errorValue)
            : String(errorValue);
        return { success: false, error: errorMsg };
      }
      evalResult.value.dispose();
      runtime.executePendingJobs();
    }

    // Read serialized output
    const outputHandle = context.getProp(context.global, "__output");
    const outputStr = context.getString(outputHandle);
    outputHandle.dispose();

    const parsed = JSON.parse(outputStr);
    if (parsed.ok) {
      return { success: true, data: parsed.data };
    } else {
      return { success: false, error: parsed.error };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("interrupted")) {
      return {
        success: false,
        error: `Execution timed out after ${timeoutMs}ms`,
      };
    }
    return { success: false, error: message };
  } finally {
    try {
      if (context) context.dispose();
    } catch {
      // Ignore ASYNCIFY cleanup errors
    }
    try {
      if (runtime) runtime.dispose();
    } catch {
      // Ignore ASYNCIFY cleanup errors
    }
  }
}
