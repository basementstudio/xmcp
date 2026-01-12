import { AsyncLocalStorage } from "async_hooks";
import type { X402PaymentContext } from "./types.js";

interface X402ContextData {
  payment: X402PaymentContext;
}

const storageKey = Symbol.for("xmcp-x402-context");

function getOrCreateStorage(): AsyncLocalStorage<X402ContextData> {
  const existing = (globalThis as any)[storageKey];
  if (existing) {
    return existing;
  }

  const storage = new AsyncLocalStorage<X402ContextData>();
  (globalThis as any)[storageKey] = storage;
  return storage;
}

const storage = getOrCreateStorage();

export function x402ContextProvider(
  paymentContext: X402PaymentContext,
  callback: () => void
): void {
  storage.run({ payment: paymentContext }, callback);
}

export function getX402PaymentContext(): X402PaymentContext | null {
  return storage.getStore()?.payment ?? null;
}
