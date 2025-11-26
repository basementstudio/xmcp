/**
 * Wraps a promise-based client so you can call methods directly
 * without awaiting the client first.
 *
 * Usage:
 *   client.local.randomNumber()  // returns Promise, no need to await client first
 *   client.remote.greet({ name: "World" })
 */
function proxyPromise<T extends object>(clientPromise: Promise<T>): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      return async (...args: unknown[]) => {
        const client = await clientPromise;
        const method = (client as Record<string | symbol, unknown>)[prop];
        if (typeof method === "function") {
          return method.call(client, ...args);
        }
        throw new Error(`Property "${String(prop)}" is not a function`);
      };
    },
  });
}
