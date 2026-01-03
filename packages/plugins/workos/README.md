# @xmcp-dev/workos

WorkOS AuthKit integration for xmcp MCP servers.

## Installation

```bash
npm install @xmcp-dev/workos
# or
pnpm add @xmcp-dev/workos
```

## Usage

### 1. Configure the middleware

Create a `middleware.ts` file in your xmcp project:

```typescript
import { workosProvider } from "@xmcp-dev/workos";

export default workosProvider({
  apiKey: process.env.WORKOS_API_KEY || "",
  clientId: process.env.WORKOS_CLIENT_ID || "",
  baseURL: process.env.BASE_URL || "http://127.0.0.1:3002",
  authkitDomain: process.env.WORKOS_AUTHKIT_DOMAIN || "",
});
```

### 2. Environment Variables

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
BASE_URL=http://127.0.0.1:3002
WORKOS_AUTHKIT_DOMAIN=your-subdomain.authkit.app
```

### 3. Access Session in Tools

```typescript
import { getWorkOSSession, getWorkOSUser } from "@xmcp-dev/workos";

export default async function myTool() {
  // Get session data from JWT (fast, no API call)
  const session = getWorkOSSession();
  console.log(session.userId);
  console.log(session.organizationId);
  console.log(session.role);
  console.log(session.permissions);

  // Get full user data from WorkOS API
  const user = await getWorkOSUser();
  console.log(user.email);
  console.log(user.firstName);
  console.log(user.lastName);

  return {
    content: [{ type: "text", text: `Hello ${user.firstName}!` }],
  };
}
```

## API Reference

### `workosProvider(config)`

Creates the WorkOS middleware and router for xmcp.

**Config:**
- `apiKey` - WorkOS API key
- `clientId` - WorkOS Client ID
- `baseURL` - Base URL of your MCP server
- `authkitDomain` - AuthKit domain (e.g., `your-subdomain.authkit.app`)

### `getWorkOSSession()`

Returns the current session from JWT claims. Throws if not authenticated.

**Returns:** `WorkOSSession`
- `userId` - WorkOS user ID
- `sessionId` - Session ID
- `organizationId` - Organization ID (optional)
- `role` - User role (optional)
- `permissions` - Array of permissions (optional)
- `expiresAt` - Token expiration date
- `issuedAt` - Token issued date
- `claims` - Raw JWT claims

### `getWorkOSSessionOrNull()`

Safe version that returns `null` instead of throwing.

### `getWorkOSUser()`

Fetches full user data from WorkOS API using the SDK.

**Returns:** WorkOS `User` object with email, name, profile picture, etc.

### `getWorkOSClient()`

Returns the initialized WorkOS SDK client for advanced use cases.

## OAuth Endpoints

The plugin automatically registers these endpoints:

- `GET /.well-known/oauth-protected-resource` - Resource server metadata
- `GET /.well-known/oauth-authorization-server` - Authorization server metadata

## How It Works

1. MCP clients send requests with `Authorization: Bearer <token>` header
2. The middleware verifies the JWT using WorkOS AuthKit's JWKS endpoint
3. Valid sessions are stored in AsyncLocalStorage context
4. Tools can access session data via `getWorkOSSession()`
5. Full user data can be fetched via `getWorkOSUser()` (uses WorkOS SDK)

## License

MIT
