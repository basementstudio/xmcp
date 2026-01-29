export const cloudflareTypeDefinition = `
/**
 * Cloudflare Workers environment bindings.
 * Extend this interface with your own bindings (KV, D1, etc.)
 */
export interface Env {
  [key: string]: unknown;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

declare const _default: {
  fetch: (request: Request, env: Env, ctx: ExecutionContext) => Promise<Response>;
};
export default _default;
`;
