# @xmcp-dev/auth0

Auth0 authentication integration for [xmcp](https://xmcp.dev).

## Installation

```bash
npm install @xmcp-dev/auth0
# or
pnpm add @xmcp-dev/auth0
# or
yarn add @xmcp-dev/auth0
```

## Quick Start

### 1. Configure the Auth0 Provider

Create a `src/middleware.ts` file:

```typescript
import { auth0Provider } from "@xmcp-dev/auth0";

export default auth0Provider({
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_AUDIENCE!,
  baseURL: process.env.BASE_URL!,
  management: {
    clientId: process.env.AUTH0_MGMT_CLIENT_ID!,
    clientSecret: process.env.AUTH0_MGMT_CLIENT_SECRET!,
  },
});
```

### 2. Protect Your Tools

#### Using inferred scopes (no wrapper required)

```typescript
// src/tools/greet.ts
import { getAuthInfo } from "@xmcp-dev/auth0";
import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the authenticated user",
};

export default async function greet({ name }: { name?: string }) {
  const authInfo = getAuthInfo();
  return `Hello, ${authInfo.user.name ?? name}!`;
}
```

Scopes are inferred from the tool metadata name as `tool:<metadata.name>` (e.g., `metadata.name = "greet"` → `tool:greet`). The scope configured in Auth0 should match the tool name you expose. If a scope does not exist in Auth0 **and** is not present in the caller token, the tool is treated as public.

#### Using `getAuthInfo` directly

Use this when you don't need scope checks. The middleware still ensures the request is authenticated.

```typescript
// src/tools/whoami.ts
import { getAuthInfo } from "@xmcp-dev/auth0";
import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Get current user info",
};

export default async function whoami() {
  const authInfo = getAuthInfo();
  return `User ID: ${authInfo.user.sub}, Email: ${authInfo.user.email}`;
}
```

### 3. Environment Variables

Create a `.env` file:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com  # Format: <tenant>.<region>.auth0.com (e.g., dev-xmcp.us.auth0.com)
AUTH0_AUDIENCE=http://localhost:3001/   # Must match API identifier exactly
BASE_URL=http://localhost:3001

# Management API credentials (required for permission enforcement)
AUTH0_MGMT_CLIENT_ID=your-m2m-client-id
AUTH0_MGMT_CLIENT_SECRET=your-m2m-client-secret
```

> **Note**: The Management API credentials come from a Machine-to-Machine application in Auth0 with `read:resource_servers` permission on the Auth0 Management API.

## API Reference

### `auth0Provider(config)`

Creates the Auth0 authentication provider for xmcp.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `domain` | `string` | Yes | Your Auth0 domain |
| `audience` | `string` | Yes | The API identifier configured in Auth0 |
| `baseURL` | `string` | Yes | The base URL of your MCP server |
| `management` | `object` | Yes | Management API configuration (see below) |
| `scopesSupported` | `string[]` | No | List of custom scopes for OAuth metadata |

#### `management` options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clientId` | `string` | Yes | M2M application client ID |
| `clientSecret` | `string` | Yes | M2M application client secret |
| `audience` | `string` | No | Management API audience (default: `https://<domain>/api/v2/`) |
| `resourceServerIdentifier` | `string` | No | API identifier to check permissions against |

### Scope enforcement behavior

- Scope name: `tool:<metadata.name>` from each tool definition.
- The plugin fetches the API permission list from Auth0 Management API on every request.

#### Permission Decision Matrix

| Permission in Auth0? | User has Permission? | Result |
|---------------------|---------------------|--------|
| Yes | Yes | **ALLOWED** (protected tool) |
| Yes | No | **DENIED** |
| No | Yes | **ALLOWED** |
| No | No | **ALLOWED** (public tool) |

#### Public vs Protected Tools

- **Protected tool**: Add the permission `tool:<tool-name>` to your Auth0 API. Users must have this permission.
- **Public tool**: Don't add the permission to Auth0. Any authenticated user can access it.

### `getAuthInfo()`

Gets the current user's authentication info from context.

```typescript
const authInfo = getAuthInfo();
console.log(authInfo.user.sub);   // User ID
console.log(authInfo.user.email); // Email
console.log(authInfo.scopes);      // Granted scopes
```

### `getUser()`

Gets the full user profile from Auth0 Management API. Requires management config.

```typescript
import { getUser } from "@xmcp-dev/auth0";

export default async function userProfile() {
  const user = await getUser();
  return `Name: ${user.name}, Email: ${user.email}`;
}
```

**Throws:** Error if user lacks permission to access profile data.

### `getManagementClient()`

Gets the Auth0 Management API client for advanced operations.

```typescript
import { getManagementClient, getAuthInfo } from "@xmcp-dev/auth0";

export default async function updateMetadata({ key, value }) {
  const authInfo = getAuthInfo();
  const client = getManagementClient();
  await client.users.update(authInfo.user.sub, {
    user_metadata: { [key]: value }
  });
  return "Metadata updated";
}
```

### Error Classes

The plugin exports two error classes for handling authentication failures:

- **`InsufficientScopeError`** - Thrown when user lacks required scopes for a tool
- **`InvalidTokenError`** - Thrown when the access token is invalid or missing

```typescript
import { InsufficientScopeError, InvalidTokenError } from "@xmcp-dev/auth0";

try {
  // ... tool logic
} catch (error) {
  if (error instanceof InsufficientScopeError) {
    return "You don't have permission to perform this action.";
  }
}
```

## Auth Info Structure

```typescript
interface AuthInfo {
  token: string;           // Raw access token
  clientId: string;        // OAuth client ID
  scopes: string[];        // Granted scopes
  permissions?: string[];  // RBAC permissions granted to this token
  expiresAt?: number;      // Expiration timestamp
  user: {
    sub: string;           // User ID
    client_id?: string;    // Client ID claim
    azp?: string;          // Authorized party
    name?: string;         // User's name
    email?: string;        // User's email
  };
}
```

## OAuth Endpoints

The plugin serves two OAuth metadata endpoints:

- `GET /.well-known/oauth-protected-resource` - Resource server metadata
- `GET /.well-known/oauth-authorization-server` - Proxies Auth0's OIDC config

## Auth0 Tenant Setup

MCP clients use Dynamic Client Registration (DCR) and the OAuth 2.0 Resource Parameter to authenticate. Your Auth0 tenant requires specific configuration for this to work.

> **Reference**: Based on [Auth0's official MCP sample](https://github.com/auth0-samples/auth0-ai-samples/blob/main/auth-for-mcp/fastmcp-mcp-js/README.md#auth0-tenant-setup)

### Step 1: Enable Dynamic Client Registration

MCP clients register themselves automatically with your Auth0 tenant.

1. Go to **Auth0 Dashboard** → **Settings** → **Advanced**
2. Enable **"OIDC Dynamic Application Registration"**
3. Save changes

Or via Auth0 CLI:
```bash
auth0 api patch tenants/settings --data '{"flags":{"enable_dynamic_client_registration":true}}'
```

### Step 2: Enable Resource Parameter Compatibility Profile

The MCP specification requires the `resource` parameter (RFC 8707). Auth0 needs this compatibility profile enabled.

1. Go to **Auth0 Dashboard** → **Settings** → **Advanced**
2. Enable **"Resource Parameter Compatibility Profile"**
3. Save changes

> See [Auth0 docs](https://auth0.com/ai/docs/mcp/guides/resource-param-compatibility-profile) for details.

### Step 3: Promote Connection to Domain Level

DCR-registered clients are third-party by default and can only use domain-level connections.

1. Go to **Auth0 Dashboard** → **Authentication** → **Database**
2. Select your connection (e.g., `Username-Password-Authentication`)
3. Enable **"Enable for third-party clients"** (or "Promote to domain level")
4. Save changes

Or via Auth0 CLI:
```bash
# List connections to get ID
auth0 api get connections

# Promote connection (replace YOUR_CONNECTION_ID)
auth0 api patch connections/YOUR_CONNECTION_ID --data '{"is_domain_connection":true}'
```

### Step 4: Create the API

**Important**: The API identifier must match your `BASE_URL` exactly, including the trailing slash.

1. Go to **Auth0 Dashboard** → **Applications** → **APIs**
2. Click **Create API**
3. Set:
   - **Name**: e.g., `MCP Server API`
   - **Identifier**: Your server URL with trailing slash (e.g., `http://localhost:3001/`)
   - **Signing Algorithm**: `RS256`
4. Go to **Permissions** tab and add your scopes:
   - `tool:greet` - Access the greeting tool
   - `tool:whoami` - Access the whoami tool

Or via Auth0 CLI:
```bash
auth0 api post resource-servers --data '{
  "identifier": "http://localhost:3001/",
  "name": "MCP Server API",
  "signing_alg": "RS256",
  "scopes": [
    {"value": "tool:greet", "description": "Access the greeting tool"},
    {"value": "tool:whoami", "description": "Access the whoami tool"}
  ]
}'
```

### Step 5: Set Default Audience

1. Go to **Auth0 Dashboard** → **Settings** → **General**
2. Under **API Authorization Settings**, set **Default Audience** to your API identifier (e.g., `http://localhost:3001/`)
3. Save changes

### Important Notes

- **API Identifier must match BASE_URL**: MCP clients send a `resource` parameter that Auth0 uses as the audience. If there's a mismatch (even a missing trailing slash), you'll get "Service not found" errors.
- **Trailing slash matters**: If your `BASE_URL` is `http://localhost:3001`, the MCP client may send `http://localhost:3001/` as the resource. Create your API with the trailing slash to match.
- **DCR clients are third-party**: They require domain-level connections to authenticate users.

### Environment Variables

After setup, configure your `.env`:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=http://localhost:3001/   # Must match API identifier exactly
BASE_URL=http://localhost:3001
```