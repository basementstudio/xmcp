import type { Env, ExecutionContext } from "../types";

/**
 * Auth info returned by middleware.
 * Same structure as other adapters for consistency.
 */
export interface AuthInfo {
  token: string;
  clientId: string;
  scopes: string[];
  expiresAt?: number;
  extra?: Record<string, unknown>;
}

/**
 * Next function passed to middleware.
 * Call with optional authInfo to continue to MCP handler.
 */
export type NextFunction = (authInfo?: AuthInfo) => Promise<Response>;

/**
 * Cloudflare Workers middleware function.
 * Similar to Express middleware but uses Web APIs.
 *
 * @param request - Incoming Web Request
 * @param env - Cloudflare environment bindings
 * @param ctx - Execution context (for waitUntil, etc.)
 * @param next - Call to continue to MCP handler, optionally with authInfo
 * @returns Response (error) or result of next()
 */
export type CloudflareMiddleware = (
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  next: NextFunction
) => Promise<Response> | Response;
