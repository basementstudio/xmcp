/**
 * CORS handling for Cloudflare Workers adapter.
 */

import type { CorsConfig } from "@/compiler/config";
import { buildCorsHeaders } from "@/runtime/transports/http/cors/headers";

// CORS config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

/**
 * Add CORS headers to a Response
 */
export function addCorsHeaders(
  response: Response,
  requestOrigin: string | null
): Response {
  const headers = new Headers(response.headers);

  const corsHeaders = buildCorsHeaders(corsConfig, requestOrigin);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreflightRequest(
  requestOrigin: string | null
): Response {
  const headers = new Headers(buildCorsHeaders(corsConfig, requestOrigin));

  return new Response(null, {
    status: 204,
    headers,
  });
}
