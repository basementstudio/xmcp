/**
 * Auth orchestration for Cloudflare Workers adapter.
 * Coordinates between built-in auth (OAuth/API key) and custom middleware.
 */

import type { Env, ExecutionContext } from "../types";
import { addCorsHeaders } from "../cors";
import { AuthInfo, CloudflareMiddleware } from "./types";
import { createUnauthorizedResponse } from "./responses";

// Custom middleware - injected by compiler (undefined if no src/middleware.ts)
// @ts-expect-error: injected by compiler
const injectedMiddleware = INJECTED_MIDDLEWARE as
  | (() => Promise<{
      default: CloudflareMiddleware | CloudflareMiddleware[];
    }>)
  | undefined;

/**
 * Built-in authentication with the following priority:
 *
 * 1. **OAuth JWT** (if configured) - Checked first. If a Bearer token is present
 *    and OAuth is configured, it will be validated as a JWT. Returns error if
 *    validation fails, or authInfo if valid.
 *
 * 2. **API key** (if configured) - Fallback if no OAuth token provided or OAuth
 *    not configured. Validates against MCP_API_KEY environment variable.
 *
 * 3. **No auth** (if neither configured) - Allows unauthenticated access when
 *    neither OAuth nor API key is configured.
 *
 * @param request - Incoming HTTP request
 * @param env - Cloudflare environment bindings
 * @param requestOrigin - Origin header from request (for CORS)
 * @returns AuthInfo if authenticated, null if no auth required, or error Response
 */
/**
 * Run custom middleware chain and return final authInfo.
 * Middleware is required for Cloudflare adapter auth.
 */
export async function runMiddleware(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
  requestOrigin: string | null
): Promise<{ authInfo: AuthInfo | null } | { error: Response }> {
  if (!injectedMiddleware) {
    return {
      error: addCorsHeaders(
        createUnauthorizedResponse(
          "Unauthorized: Missing auth middleware",
          requestOrigin
        ),
        requestOrigin
      ),
    };
  }

  // Load middleware module
  const middlewareModule = await injectedMiddleware();
  if (!middlewareModule?.default) {
    return {
      error: addCorsHeaders(
        createUnauthorizedResponse(
          "Unauthorized: Missing auth middleware",
          requestOrigin
        ),
        requestOrigin
      ),
    };
  }

  const middlewares: CloudflareMiddleware[] = Array.isArray(
    middlewareModule.default
  )
    ? middlewareModule.default
    : [middlewareModule.default];

  let index = 0;
  let finalAuthInfo: AuthInfo | null = null;

  const sentinelResponse = new Response(null, { status: 204 });

  const next = async (authInfo?: AuthInfo): Promise<Response> => {
    if (authInfo) {
      finalAuthInfo = authInfo;
    }

    if (index < middlewares.length) {
      const middleware = middlewares[index++];
      return middleware(request, env, ctx, next);
    }

    return sentinelResponse;
  };

  try {
    const response = await next();

    if (response === sentinelResponse) {
      return { authInfo: finalAuthInfo };
    }

    // Middleware returned a response (e.g., error/unauthorized)
    return { error: addCorsHeaders(response, requestOrigin) };
  } catch (error) {
    console.error("[Cloudflare-MCP] Middleware error:", error);
    return {
      error: addCorsHeaders(
        new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: { code: -32603, message: "Middleware error" },
            id: null,
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        ),
        requestOrigin
      ),
    };
  }
}
