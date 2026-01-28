import type {
  CloudflareMiddleware,
  CloudflareAuthConfig,
  AuthInfo,
} from "./types";

/**
 * Built-in auth middleware for Cloudflare Workers.
 * Similar to apiKeyAuthMiddleware/jwtAuthMiddleware in Node.js.
 */
export function cloudflareAuthMiddleware(
  config: CloudflareAuthConfig
): CloudflareMiddleware {
  const headerName = config.headerName ?? "authorization";
  const tokenPrefix = config.tokenPrefix ?? "Bearer ";
  const required = config.required ?? true;

  return async (request, env, _ctx, next) => {
    const authHeader = request.headers.get(headerName);

    // No auth header
    if (!authHeader) {
      if (required) {
        return new Response(
          JSON.stringify({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Unauthorized: Missing Authorization header",
            },
            id: null,
          }),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json",
              "WWW-Authenticate": 'Bearer realm="MCP API"',
            },
          }
        );
      }
      return next(); // Allow unauthenticated
    }

    // Extract token
    const token = authHeader.startsWith(tokenPrefix)
      ? authHeader.slice(tokenPrefix.length)
      : authHeader;

    try {
      const result = await config.validateToken(token, env);

      if (!result) {
        if (required) {
          return new Response(
            JSON.stringify({
              jsonrpc: "2.0",
              error: { code: -32001, message: "Unauthorized: Invalid token" },
              id: null,
            }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
        return next();
      }

      const authInfo: AuthInfo = {
        token,
        ...result,
      };

      return next(authInfo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Token validation failed";
      return new Response(
        JSON.stringify({
          jsonrpc: "2.0",
          error: { code: -32001, message: `Unauthorized: ${message}` },
          id: null,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
  };
}
