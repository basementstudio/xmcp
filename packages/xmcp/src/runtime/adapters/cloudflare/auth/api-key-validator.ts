/**
 * API key validation for Cloudflare Workers adapter.
 */

import type { Env } from "../types";
import type { AuthInfo } from "../middleware/types";
import { createUnauthorizedResponse } from "./responses";

// HTTP config - injected by compiler
// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as {
  debug: boolean;
};

const { debug } = httpConfig;

/**
 * Log a message if debug mode is enabled
 */
function log(message: string, ...args: unknown[]): void {
  if (debug) {
    console.log(`[Cloudflare-MCP] ${message}`, ...args);
  }
}

/**
 * Validate API key from Authorization header.
 * Returns auth info if valid, null if no API key configured, or an error Response if invalid.
 */
export function validateApiKey(
  request: Request,
  env: Env,
  requestOrigin: string | null
): { authInfo: AuthInfo | null } | { error: Response } {
  // If no API key is configured, allow all requests (no auth required)
  if (!env.MCP_API_KEY) {
    return { authInfo: null };
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return {
      error: createUnauthorizedResponse(
        "Missing Authorization header",
        requestOrigin
      ),
    };
  }

  // Support "Bearer <token>" format
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (token !== env.MCP_API_KEY) {
    log("Invalid API key provided");
    return {
      error: createUnauthorizedResponse("Invalid API key", requestOrigin),
    };
  }

  // Valid API key
  return {
    authInfo: {
      token,
      clientId: "api-key",
      scopes: ["mcp:access"],
    },
  };
}
