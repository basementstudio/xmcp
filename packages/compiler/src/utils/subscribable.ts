/* eslint-disable @typescript-eslint/no-explicit-any */
type AnyFunction = (...args: any[]) => any;

export interface Subscribable<T extends AnyFunction = AnyFunction> {
  addCallback: (callback: T, id?: string) => string;
  removeCallback: (id: string | T) => void;
  getCallbacks: () => T[];
  getCallback: (id: string) => T;
  getCallbackIds: () => string[];
  clearCallbacks: () => void;
  runCallbacks: T;
}

export const subscribable = <
  T extends AnyFunction = AnyFunction,
>(): Subscribable<T> => {
  const callbacks: Record<string, T> = {};

  const addCallback = (callback: T, id: string): string => {
    const _id = id || crypto.randomUUID();
    callbacks[_id] = callback;
    return _id;
  };

  const removeCallback = (id: string | AnyFunction): void => {
    if (typeof id === "function") {
      const key = Object.keys(callbacks).find((k) => callbacks[k] === id);
      if (key) delete callbacks[key];
      return;
    }

    delete callbacks[id];
  };

  const getCallbacks = (): T[] => Object.values(callbacks);

  const getCallback = (id: string): T => callbacks[id];

  const clearCallbacks = (): void => {
    Object.keys(callbacks).forEach((id) => {
      removeCallback(id);
    });
  };

  const runCallbacks = (...params: unknown[]): void => {
    let response = undefined as any;
    Object.values(callbacks).forEach((callback) => {
      response = callback(...params);
    });
    return response;
  };

  return {
    addCallback,
    removeCallback,
    getCallback,
    getCallbacks,
    getCallbackIds: () => Object.keys(callbacks),
    clearCallbacks,
    runCallbacks: runCallbacks as unknown as T,
  } as Subscribable<T>;
};
