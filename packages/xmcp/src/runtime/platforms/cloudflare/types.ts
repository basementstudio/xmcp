/**
 * Shared types for Cloudflare Workers adapter.
 * Placed here to avoid circular dependencies.
 */

/**
 * Cloudflare Workers environment bindings.
 * Users can extend this with their own bindings.
 */
export interface Env {
  /**
   * Additional user-defined bindings (KV, D1, etc.)
   */
  [key: string]: unknown;
}

/**
 * Cloudflare Workers ExecutionContext type
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
