import { AsyncLocalStorage } from "async_hooks";

type DefaultContext = Object;

type GetContext<T extends DefaultContext> = () => T;

type SetContext<T extends DefaultContext> = (data: Partial<T>) => void;

export interface Context<T extends DefaultContext> {
  /** Run a callback with a specific context. */
  provider: (initialValue: T, callback: () => void) => void;
  /** Get the context. */
  getContext: GetContext<T>;
  /** Partially update the context. */
  setContext: SetContext<T>;
}

interface CreateContextOptions {
  name: string;
}

const setGlobalContext = <T>(key: symbol, context: T) => {
  (globalThis as any)[key] = context;
};

const getGlobalContext = <T>(key: symbol): T => {
  return (globalThis as any)[key] as T;
};

/**
 * Create context allows you to create scoped variables for fucntions.
 * Similar to React's context API.
 * Usage:
 * ```ts
 * interface MyContext {
 *   value: string;
 * }
 *
 * const context = createContext({ name: "my-context" });
 *
 * context.provider({
 *   value: "hello",
 * }, () => {
 *   // Do something with the context
 * })```
 */
export function createContext<T extends Object>({
  name,
}: CreateContextOptions): Context<T> {
  const storageKey = Symbol.for(`xmcp-context-${name}`);

  if (getGlobalContext(storageKey)) {
    return getGlobalContext<Context<T>>(storageKey);
  }

  const context = new AsyncLocalStorage<T>();

  const getContext: GetContext<T> = () => {
    const store = context.getStore();

    if (!store) {
      throw new Error(
        `getContext() can only be used within the ${name} context.`
      );
    }

    return store;
  };

  const setContext: SetContext<T> = (data) => {
    const store = context.getStore();

    if (!store) {
      throw new Error(
        `setContext() can only be used within the ${name} context.`
      );
    }

    Object.assign(store, data);
  };

  const provider = (initialValue: T, callback: () => void) => {
    return context.run(initialValue, callback);
  };

  const result: Context<T> = {
    provider,
    getContext,
    setContext,
  };

  setGlobalContext(storageKey, result);

  return result;
}
