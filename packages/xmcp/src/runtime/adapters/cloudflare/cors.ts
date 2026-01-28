/**
 * CORS handling for Cloudflare Workers adapter.
 */

// CORS config - injected by compiler as combined object
// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as {
  origin: string;
  methods: string;
  allowedHeaders: string;
  exposedHeaders: string;
  credentials: boolean;
  maxAge: number;
};

// Destructure for easier access
const {
  origin: corsOrigin,
  methods: corsMethods,
  allowedHeaders: corsAllowedHeaders,
  exposedHeaders: corsExposedHeaders,
  credentials: corsCredentials,
  maxAge: corsMaxAge,
} = corsConfig;

/**
 * Add CORS headers to a Response
 */
export function addCorsHeaders(
  response: Response,
  requestOrigin: string | null
): Response {
  const headers = new Headers(response.headers);

  // Origin priority:
  // 1) Config wildcard "*" - allows all origins
  // 2) Config specific origin - uses configured value
  // 3) Request origin - echoes back the requesting origin
  // 4) Wildcard fallback - allows all if nothing else configured
  const origin =
    corsOrigin === "*" ? "*" : corsOrigin || requestOrigin || "*";

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    corsMethods || "GET, POST, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    corsAllowedHeaders || "Content-Type, Authorization, Accept, mcp-session-id"
  );

  if (corsExposedHeaders) {
    headers.set("Access-Control-Expose-Headers", corsExposedHeaders);
  }

  if (corsCredentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (corsMaxAge) {
    headers.set("Access-Control-Max-Age", String(corsMaxAge));
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
export function handleCorsPreflightRequest(requestOrigin: string | null): Response {
  const headers = new Headers();

  const origin =
    corsOrigin === "*" ? "*" : corsOrigin || requestOrigin || "*";

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set(
    "Access-Control-Allow-Methods",
    corsMethods || "GET, POST, OPTIONS"
  );
  headers.set(
    "Access-Control-Allow-Headers",
    corsAllowedHeaders || "Content-Type, Authorization, Accept, mcp-session-id"
  );

  if (corsExposedHeaders) {
    headers.set("Access-Control-Expose-Headers", corsExposedHeaders);
  }

  if (corsCredentials) {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  if (corsMaxAge) {
    headers.set("Access-Control-Max-Age", String(corsMaxAge));
  }

  return new Response(null, {
    status: 204,
    headers,
  });
}
