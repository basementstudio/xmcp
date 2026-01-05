# WorkOS Plugin - PR Summary

## Overview

This PR adds a WorkOS AuthKit plugin for xmcp that enables OAuth 2.1 authentication for MCP servers.

## Why SDK vs Direct API Calls

| Component | Approach | Reason |
|-----------|----------|--------|
| **JWT Verification** | `jose` library | WorkOS SDK doesn't support bearer token verification. MCP requires stateless auth. [Recommended by WorkOS docs](https://workos.com/docs/authkit/mcp). |
| **Token Exchange** | SDK (`authenticateWithCode`) | SDK handles OAuth complexity and returns typed objects |
| **User Fetching** | SDK (`getUser`) | JWT only contains `userId` - email/name require API call |

## Architecture: Session vs User

### `getWorkOSSession()` - Synchronous, No API Call
- Extracts data directly from JWT claims
- Returns: `userId`, `sessionId`, `organizationId`, `role`, `permissions`
- Fast - no network request needed

### `getWorkOSUser()` - Async, API Call Required
- Calls WorkOS API via SDK: `workos.userManagement.getUser()`
- Returns: `email`, `firstName`, `lastName`, `emailVerified`, `profilePictureUrl`
- Use when you need full user profile data

## Key Implementation Details

### 1. Stateless JWT Verification
Per the [MCP spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization) and [WorkOS docs](https://workos.com/docs/authkit/mcp), we verify tokens locally using JWKS:
- Fetch public keys from `https://{authkit-domain}/.well-known/oauth2/jwks`
- Verify signature and claims (issuer, expiration)
- No database or session store needed

### 2. OAuth Protected Resource Metadata (RFC 8707)
We expose `/.well-known/oauth-protected-resource` so MCP clients can discover our auth server:
```json
{
  "resource": "https://your-server.com",
  "authorization_servers": ["https://your.authkit.app"]
}
```

### 3. Authorization Server Metadata Proxy
We proxy AuthKit's `/.well-known/openid-configuration` because:
- MCP clients need to discover endpoints (authorize, token, jwks)
- AuthKit doesn't support Dynamic Client Registration (DCR)
- Clients must pre-configure their `client_id`

### 4. Fail-Fast Config Validation
The plugin throws immediately if required config is missing:
```typescript
if (!config.apiKey) throw new Error("[WorkOS] Missing required config: apiKey");
```

## Files Changed

### Plugin (`packages/plugins/workos/`)
- `provider.ts` - OAuth routes, middleware, config validation
- `jwt.ts` - JWT verification with JWKS
- `session.ts` - `getWorkOSSession()` and `getWorkOSUser()` helpers
- `utils.ts` - AuthKit URL construction utilities
- `types.ts` - TypeScript interfaces

### Example (`examples/workos-http/`)
- `middleware.ts` - Plugin configuration
- `tools/greet.ts` - Demo tool using session
- `tools/whoami.ts` - Demo tool using session + user
- `resources/[userId]/profile.ts` - Resource using WorkOS API
- `prompts/user-context.ts` - Personalized prompt using user data
- `.env.example` - Required environment variables

### Docs (`apps/website/content/docs/integrations/`)
- `workos.mdx` - Plugin documentation

## References
- [WorkOS AuthKit MCP Docs](https://workos.com/docs/authkit/mcp)
- [MCP Authorization Spec](https://modelcontextprotocol.io/specification/2025-03-26/basic/authorization)
- [OAuth Protected Resource Metadata - RFC 8707](https://datatracker.ietf.org/doc/html/rfc8707)
