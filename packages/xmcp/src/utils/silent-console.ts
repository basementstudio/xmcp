type ConsoleMethod = "log" | "debug" | "info" | "warn" | "error";

type ConsoleMethodFn = (...args: unknown[]) => void;

type AsyncLocalStorageLike<T> = {
  run<R>(store: T, callback: () => R): R;
  getStore(): T | undefined;
};

type AsyncLocalStorageCtor = new <T>() => AsyncLocalStorageLike<T>;
type SuppressionToken = { active: boolean };

const SILENCED_METHODS: ConsoleMethod[] = [
  "log",
  "debug",
  "info",
  "warn",
  "error",
];

let isConsolePatched = false;
let fallbackSuppressionDepth = 0;
let asyncLocalStorage: AsyncLocalStorageLike<SuppressionToken> | undefined;
let asyncLocalStorageInitialized = false;

const originalConsole: Partial<Record<ConsoleMethod, ConsoleMethodFn>> = {};

function loadAsyncLocalStorageCtor(): AsyncLocalStorageCtor | undefined {
  try {
    const getBuiltinModule = (process as any).getBuiltinModule as
      | ((id: string) => unknown)
      | undefined;
    if (typeof getBuiltinModule === "function") {
      const asyncHooks = getBuiltinModule("async_hooks") as {
        AsyncLocalStorage?: AsyncLocalStorageCtor;
      };
      if (asyncHooks?.AsyncLocalStorage) {
        return asyncHooks.AsyncLocalStorage;
      }
    }

    const requireFn = (0, eval)(
      "typeof require !== 'undefined' ? require : undefined"
    ) as ((id: string) => unknown) | undefined;

    if (!requireFn) {
      return undefined;
    }

    const asyncHooks = requireFn("async_hooks") as {
      AsyncLocalStorage?: AsyncLocalStorageCtor;
    };

    return asyncHooks.AsyncLocalStorage;
  } catch {
    return undefined;
  }
}

function ensureAsyncLocalStorage(): void {
  if (asyncLocalStorageInitialized) {
    return;
  }

  asyncLocalStorageInitialized = true;
  const AsyncLocalStorage = loadAsyncLocalStorageCtor();
  if (AsyncLocalStorage) {
    asyncLocalStorage = new AsyncLocalStorage<SuppressionToken>();
  }
}

function isSuppressed(): boolean {
  if (asyncLocalStorage?.getStore()?.active === true) {
    return true;
  }

  return fallbackSuppressionDepth > 0;
}

function patchConsoleIfNeeded(): void {
  if (isConsolePatched) {
    return;
  }

  const patchedMethods = new Map<ConsoleMethod, ConsoleMethodFn>();
  for (const method of SILENCED_METHODS) {
    const original = (console[method] as ConsoleMethodFn).bind(console);
    originalConsole[method] = original;
    patchedMethods.set(method, (...args: unknown[]) => {
      if (isSuppressed()) {
        return;
      }

      original(...args);
    });
  }

  const applied: ConsoleMethod[] = [];
  try {
    for (const [method, patched] of patchedMethods) {
      (console[method] as ConsoleMethodFn) = patched;
      applied.push(method);
    }

    isConsolePatched = true;
  } catch (error) {
    for (const method of applied) {
      const original = originalConsole[method];
      if (original) {
        (console[method] as ConsoleMethodFn) = original;
      }
    }
    throw error;
  }
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return (
    value !== null &&
    (typeof value === "object" || typeof value === "function") &&
    typeof (value as PromiseLike<unknown>).then === "function"
  );
}

/**
 * Wrap a tool handler so `console.log/debug/info/warn/error` calls are silenced
 * during this handler's execution while preserving normal console behavior
 * outside of the wrapped scope.
 */
export function silenceConsoleInTool<T extends (...args: any[]) => any>(
  handler: T
): T {
  const wrapped = function (this: unknown, ...args: Parameters<T>): ReturnType<T> {
    patchConsoleIfNeeded();
    ensureAsyncLocalStorage();

    const invoke = () => handler.apply(this, args);

    if (asyncLocalStorage) {
      const token: SuppressionToken = { active: true };
      try {
        const result = asyncLocalStorage.run(token, invoke);
        if (isPromiseLike(result)) {
          return Promise.resolve(result).finally(() => {
            token.active = false;
          }) as ReturnType<T>;
        }

        token.active = false;
        return result as ReturnType<T>;
      } catch (error) {
        token.active = false;
        throw error;
      }
    }

    fallbackSuppressionDepth++;
    try {
      const result = invoke();

      if (isPromiseLike(result)) {
        // In runtimes without async context support, avoid global async suppression
        // because it can silence unrelated concurrent logs.
        fallbackSuppressionDepth--;
        return result as ReturnType<T>;
      }

      fallbackSuppressionDepth--;
      return result as ReturnType<T>;
    } catch (error) {
      fallbackSuppressionDepth--;
      throw error;
    }
  };

  return wrapped as T;
}

function restoreOriginalConsoleMethods(): void {
  if (!isConsolePatched) {
    return;
  }

  for (const method of SILENCED_METHODS) {
    const original = originalConsole[method];
    if (original) {
      (console[method] as ConsoleMethodFn) = original;
    }
  }

  isConsolePatched = false;
}

function resetStateForTests(): void {
  restoreOriginalConsoleMethods();
  fallbackSuppressionDepth = 0;
  asyncLocalStorage = undefined;
  asyncLocalStorageInitialized = false;
}

function disableAsyncLocalStorageForTests(): void {
  asyncLocalStorage = undefined;
  asyncLocalStorageInitialized = true;
}

export const __silentConsoleTestUtils = {
  resetStateForTests,
  disableAsyncLocalStorageForTests,
};
