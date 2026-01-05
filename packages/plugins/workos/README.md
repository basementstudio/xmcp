# @xmcp-dev/workos

WorkOS AuthKit integration for xmcp MCP servers. Enables OAuth 2.0 authentication for MCP clients using WorkOS Connect.

## Installation

```bash
npm install @xmcp-dev/workos
# or
pnpm add @xmcp-dev/workos
```

## WorkOS Connect Setup

Before using this plugin, you need to enable WorkOS Connect in your WorkOS Dashboard:

1. Go to your [WorkOS Dashboard](https://dashboard.workos.com)
2. Navigate to **Connect** → **Configuration**
3. Enable **MCP Auth** settings:
   - **Client ID Metadata Document (CIMD)** - Required for MCP clients to authenticate
   - **Dynamic Client Registration (DCR)** - Optional, for backwards compatibility with older MCP clients

These settings allow MCP clients (like Claude Desktop, Cursor, MCPJam, etc.) to register themselves and authenticate users through AuthKit.

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
  // Optional: Link to your API documentation
  docsURL: "https://your-docs.example.com",
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
- `docsURL` - (Optional) URL to your MCP server's API documentation

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

## Using the WorkOS SDK

The `getWorkOSClient()` function gives you access to the full [WorkOS Node SDK](https://workos.com/docs/sdks/node), allowing you to leverage all WorkOS features in your MCP tools.

### User Management

```typescript
import { getWorkOSSession, getWorkOSClient } from "@xmcp-dev/workos";

export default async function myTool() {
  const session = getWorkOSSession();
  const workos = getWorkOSClient();

  // List organization memberships
  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: session.userId,
  });

  // Update user metadata
  await workos.userManagement.updateUser(session.userId, {
    firstName: "Updated Name",
  });

  return { content: [{ type: "text", text: "Done!" }] };
}
```

### Organizations

```typescript
const workos = getWorkOSClient();
const session = getWorkOSSession();

// Get organization details
if (session.organizationId) {
  const org = await workos.organizations.getOrganization(session.organizationId);
  console.log(org.name, org.domains);
}

// List all organizations
const orgs = await workos.organizations.listOrganizations();
```

### Directory Sync (SCIM)

```typescript
const workos = getWorkOSClient();

// List directory users
const users = await workos.directorySync.listUsers({
  directory: "directory_xxx",
});

// List groups
const groups = await workos.directorySync.listGroups({
  directory: "directory_xxx",
});
```

### Audit Logs

```typescript
const workos = getWorkOSClient();
const session = getWorkOSSession();

// Create an audit log event
await workos.auditLogs.createEvent({
  organizationId: session.organizationId,
  event: {
    action: "document.viewed",
    actor: { id: session.userId, type: "user" },
    targets: [{ id: "doc_123", type: "document" }],
  },
});
```

### SSO Connections

```typescript
const workos = getWorkOSClient();
const session = getWorkOSSession();

// List SSO connections for an organization
const connections = await workos.sso.listConnections({
  organizationId: session.organizationId,
});
```

For the complete SDK documentation, see [WorkOS Node SDK Docs](https://workos.com/docs/sdks/node).

## OAuth Endpoints

The plugin automatically registers these endpoints:

- `GET /.well-known/oauth-protected-resource` - Resource server metadata
- `GET /.well-known/oauth-authorization-server` - Authorization server metadata

## How Authentication Works

### Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MCP Client    │     │    AuthKit      │     │   MCP Server    │
│ (MCPJam, etc.)  │     │    (WorkOS)     │     │  (Your Server)  │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         │  1. Discovery         │                       │
         │──────────────────────────────────────────────>│
         │                       │    /.well-known/      │
         │<──────────────────────────────────────────────│
         │                       │   "use AuthKit"       │
         │                       │                       │
         │  2. Auth Request      │                       │
         │──────────────────────>│                       │
         │                       │                       │
         │  3. User Login        │                       │
         │<─────────────────────>│                       │
         │                       │                       │
         │  4. Token Response    │                       │
         │<──────────────────────│                       │
         │                       │                       │
         │  5. API Call with Token                       │
         │──────────────────────────────────────────────>│
         │                       │     Bearer token      │
         │<──────────────────────────────────────────────│
         │                       │     Response          │
```

### The Flow

1. **Discovery**: MCP client calls your server's `/.well-known/oauth-protected-resource` to find the authorization server (AuthKit)
2. **Authentication**: MCP client redirects user to AuthKit for login
3. **Token Exchange**: After login, AuthKit redirects back to the MCP client with tokens
4. **API Calls**: MCP client calls your MCP server with the access token

**Important**: Your MCP server never handles OAuth callbacks. It only validates tokens.

### CIMD Auto-Registration

With **Client ID Metadata Document (CIMD)** enabled, MCP clients automatically register with AuthKit:

1. MCP clients publish metadata at `{client_url}/.well-known/oauth-client`
2. AuthKit fetches this metadata during authentication
3. No manual redirect URI configuration needed!

This means users can connect new MCP clients without any WorkOS Dashboard changes.

### When to Manually Configure Redirect URIs

You only need to add redirect URIs in WorkOS Dashboard when:

| Scenario | Action |
|----------|--------|
| CIMD-enabled client (MCPJam, Cursor, etc.) | Nothing - automatic ✅ |
| OAuth error "redirect_uri not registered" | Add the URI from the error message |
| Custom/legacy client without CIMD | Ask client developer for callback URL |
| Your own app | Define your own callback route |

### Finding the Redirect URI

If you need to manually register a client:

1. **Check the error message** - OAuth errors usually include the redirect URI
2. **Check client documentation** - Each client documents its callback URL
3. **Check server logs** - Look for the `redirect_uri` parameter in OAuth requests

### Token Lifecycle

- Access tokens are short-lived (~5 minutes)
- MCP clients automatically refresh tokens using refresh tokens
- If you see "token_expired" errors, the client should handle refresh automatically

## How It Works (Internal)

1. MCP clients send requests with `Authorization: Bearer <token>` header
2. The middleware verifies the JWT using WorkOS AuthKit's JWKS endpoint
3. Valid sessions are stored in AsyncLocalStorage context
4. Tools can access session data via `getWorkOSSession()`
5. Full user data can be fetched via `getWorkOSUser()` (uses WorkOS SDK)

## License

MIT
