# @xmcp-dev/workos

WorkOS AuthKit integration for xmcp MCP servers. Enables OAuth 2.0 authentication for MCP clients using WorkOS Connect.

## Installation

```bash
npm install @xmcp-dev/workos
# or
pnpm add @xmcp-dev/workos
```

## WorkOS Setup

Before using this plugin, we need to configure our WorkOS application:

1. Go to your [WorkOS Dashboard](https://dashboard.workos.com)
2. Set-up SSO:
   1. Save the `WORKOS_API_KEY` and `WORKOS_CLIENT_ID`
   2. Add a Redirect URL, for development we will use `http://127.0.0.1:6274/oauth/callback` for production replace it with the deployed URL
3. Set-up AuthKit:
   1. In this process, we will need to save the Auth Kit Domain, it looks like this `https://xxx.authkit.app`
4. Navigate to **Connect** and then **Configuration** to enable the following options that are inside **MCP Auth** settings:
   - **Client ID Metadata Document (CIMD)**
   - **Dynamic Client Registration (DCR)**

## Usage

### 1. Configure the middleware

Create a `middleware.ts` file in your xmcp project:

```typescript
import { workosProvider } from "@xmcp-dev/workos";

export default workosProvider({
  apiKey: process.env.WORKOS_API_KEY!,
  clientId: process.env.WORKOS_CLIENT_ID!,
  baseURL: process.env.BASE_URL!,
  authkitDomain: process.env.WORKOS_AUTHKIT_DOMAIN!,
  // Optional: Link to your API documentation
  docsURL: "https://yourserver.com/docs/mcp",
});
```

### 2. Environment Variables

```bash
WORKOS_API_KEY=sk_...
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=yourcompany.authkit.app

BASE_URL=http://127.0.0.1:3001
```

### 3. Access Session in Tools

```typescript
import { getSession, getUser } from "@xmcp-dev/workos";

export default async function myTool() {
  // Get session data from JWT (fast, no API call)
  const session = getSession();
  console.log(session.userId);
  console.log(session.organizationId);
  console.log(session.role);
  console.log(session.permissions);

  // Get full user data from WorkOS API
  const user = await getUser();
  console.log(user.email);
  console.log(user.firstName);
  console.log(user.lastName);

  return `Hello ${user.firstName}! Your user ID is ${session.userId}`;
}
```

## API Reference

### `workosProvider(config)`

Creates the WorkOS middleware and router for xmcp.

**Config:**
- `apiKey` - WorkOS API key
- `clientId` - WorkOS Client ID
- `baseURL` - Base URL of your MCP server
- `authkitDomain` - AuthKit domain
- `docsURL` - (Optional) URL for your MCP server documentation

### `getSession()`

Returns the current session from JWT claims. Throws if not authenticated.

**Returns:** `Session`
- `userId` - WorkOS user ID
- `sessionId` - Session ID
- `expiresAt` - Token expiration date
- `issuedAt` - Token issued date
- `claims` - Raw JWT claims

### `getUser()`

Fetches full user data from WorkOS API using the SDK.

**Returns:** WorkOS `User` object with email, name, profile picture, etc.

### `getClient()`

Returns the initialized WorkOS SDK client for advanced use cases.

## Using the WorkOS SDK

The `getClient()` function gives you access to the full [WorkOS Node SDK](https://workos.com/docs/sdks/node), allowing you to leverage all WorkOS features in your MCP tools.

### User Management

```typescript
import { getSession, getClient } from "@xmcp-dev/workos";

export default async function myTool() {
  const session = getSession();
  const workos = getClient();

  // List organization memberships
  const memberships = await workos.userManagement.listOrganizationMemberships({
    userId: session.userId,
  });

  // Update user metadata
  await workos.userManagement.updateUser(session.userId, {
    firstName: "Updated Name",
  });

  return "Done!";
}
```

### Organizations

```typescript
const workos = getClient();
const session = getSession();

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
const workos = getClient();

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
const workos = getClient();
const session = getSession();

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

### Token Lifecycle

- Access tokens are short-lived
- MCP clients automatically refresh tokens using refresh tokens
- If you see "token_expired" errors, the client should handle refresh automatically