import { cloudflareAuthMiddleware } from "xmcp/cloudflare";

/**
 * Simple API key middleware for Cloudflare Workers.
 *
 * Uses `cloudflareAuthMiddleware` with a custom validator that checks
 * the Bearer token against `env.MCP_API_KEY`.
 *
 * Set `required: false` so tools still work without auth —
 * authenticated requests simply get `authInfo` passed through.
 *
 * To enable:
 *   wrangler secret put MCP_API_KEY
 */
export default cloudflareAuthMiddleware({
  required: true,
  validateToken: (token, env) => {
    if (token === env.MCP_API_KEY) {
      return {
        clientId: "api-key-user",
        scopes: [],
      };
    }
    return null; // invalid token
  },
});
