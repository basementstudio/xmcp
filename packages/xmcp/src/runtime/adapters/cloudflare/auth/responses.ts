/**
 * Auth response helpers for Cloudflare Workers adapter.
 * Creates RFC 6750 & RFC 9728 compliant error responses.
 */

import { addCorsHeaders } from "../cors";

/**
 * Create an unauthorized response with proper headers (RFC 6750 & RFC 9728 compliant).
 * Includes resource_metadata for MCP client discovery.
 */
export function createUnauthorizedResponse(
  message: string,
  requestOrigin: string | null,
  baseUrl?: string,
  requiredScopes?: string[]
): Response {
  // Build WWW-Authenticate header per RFC 9728 Section 5.1
  let wwwAuthenticate = 'Bearer realm="MCP API"';
  if (baseUrl) {
    wwwAuthenticate += `, resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;
  }
  if (requiredScopes?.length) {
    wwwAuthenticate += `, scope="${requiredScopes.join(" ")}"`;
  }

  return addCorsHeaders(
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: `Unauthorized: ${message}`,
        },
        id: null,
      }),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": wwwAuthenticate,
        },
      }
    ),
    requestOrigin
  );
}

/**
 * Create a forbidden response with WWW-Authenticate header (RFC 6750 Section 3.1 compliant).
 * Used when a client provides a valid token but lacks required scopes.
 */
export function createForbiddenResponse(
  message: string,
  requestOrigin: string | null,
  baseUrl?: string,
  requiredScopes?: string[]
): Response {
  // Build WWW-Authenticate header with insufficient_scope error per RFC 6750
  let wwwAuthenticate = 'Bearer error="insufficient_scope"';
  if (requiredScopes?.length) {
    wwwAuthenticate += `, scope="${requiredScopes.join(" ")}"`;
  }
  if (baseUrl) {
    wwwAuthenticate += `, resource_metadata="${baseUrl}/.well-known/oauth-protected-resource"`;
  }
  wwwAuthenticate += `, error_description="${message}"`;

  return addCorsHeaders(
    new Response(
      JSON.stringify({
        jsonrpc: "2.0",
        error: {
          code: -32003,
          message: `Forbidden: ${message}`,
        },
        id: null,
      }),
      {
        status: 403,
        headers: {
          "Content-Type": "application/json",
          "WWW-Authenticate": wwwAuthenticate,
        },
      }
    ),
    requestOrigin
  );
}
