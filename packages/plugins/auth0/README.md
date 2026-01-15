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
  domain: process.env.DOMAIN!,
  audience: process.env.AUDIENCE!,
  baseURL: process.env.BASE_URL!,
  clientId: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});
```

### 2. Protect Your Tools

#### Using inferred scopes

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

Tools require the `tool:<tool-name>` permission. Users must have this permission in their access token (via RBAC) to access the tool.

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
DOMAIN=your-tenant.auth0.com
AUDIENCE=http://127.0.0.1:3001/
BASE_URL=http://127.0.0.1:3001
CLIENT_ID=your-client-id
CLIENT_SECRET=your-client-secret
```

## API Reference

### `auth0Provider(config)`

Creates the Auth0 authentication provider for xmcp.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `domain` | `string` | Yes | Your Auth0 domain |
| `audience` | `string` | Yes | The API identifier configured in Auth0 |
| `baseURL` | `string` | Yes | The base URL of your MCP server |
| `clientId` | `string` | Yes | OAuth client ID |
| `clientSecret` | `string` | Yes | OAuth client secret |
| `scopesSupported` | `string[]` | No | List of custom scopes for OAuth metadata |
| `management` | `object` | No | Management API configuration (for admin operations) |

#### `management` options (optional)

Only needed for admin operations like updating user metadata.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `enable` | `boolean` | Yes | Enable the Management API client |
| `audience` | `string` | No | Management API audience (default: `https://<domain>/api/v2/`) |
| `resourceServerIdentifier` | `string` | No | API identifier to use for Management operations |

### Permission Enforcement

Tools require the `tool:<tool-name>` permission in the user's access token. Configure RBAC in Auth0 and assign the appropriate permissions to users/roles.

Example: For a tool with `metadata.name = "greet"`, users need the `tool:greet` permission.

### `getAuthInfo()`

Gets the current user's authentication info from context.

```typescript
const authInfo = getAuthInfo();
console.log(authInfo.user.sub);    // User ID
console.log(authInfo.user.email);  // Email
console.log(authInfo.scopes);      // Granted scopes
console.log(authInfo.permissions); // RBAC permissions
```

### Getting User Info

**From token claims (recommended):**

```typescript
const authInfo = getAuthInfo();
console.log(authInfo.user.sub);   // User ID
console.log(authInfo.user.email); // Email (if in token)
console.log(authInfo.user.name);  // Name (if in token)
```

**From /userinfo endpoint:**

```typescript
const authInfo = getAuthInfo();
const response = await fetch(`https://${process.env.AUTH0_DOMAIN}/userinfo`, {
  headers: { Authorization: `Bearer ${authInfo.token}` }
});
const userInfo = await response.json();
```

### `getClient()`

Returns the Auth0 API client for advanced operations like token exchange.

```typescript
import { getClient, getAuthInfo } from "@xmcp-dev/auth0";

// Exchange tokens to call external APIs on user's behalf
async function exchangeCustomToken(subjectToken: string) {
  const client = getClient();
  return await client.getTokenByExchangeProfile(subjectToken, {
    subjectTokenType: "urn:ietf:params:oauth:token-type:access_token",
    audience: process.env.EXTERNAL_API_AUDIENCE!,
    ...(process.env.EXCHANGE_SCOPE && { scope: process.env.EXCHANGE_SCOPE }),
  });
}

export default async function callExternalApi() {
  const authInfo = getAuthInfo();
  const { access_token } = await exchangeCustomToken(authInfo.token);

  // Use the exchanged token to call your external API
  const response = await fetch(process.env.EXTERNAL_API_URL!, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  return await response.text();
}
```

### `getManagement()`

Returns the Auth0 Management API client for admin operations. Requires `management.enable: true` in the provider config.

```typescript
import { getManagement, getAuthInfo } from "@xmcp-dev/auth0";

export default async function updateUserMetadata() {
  const authInfo = getAuthInfo();
  const client = getManagement();

  await client.users.update(authInfo.user.sub, {
    user_metadata: { theme: "dark" },
  });
  return "Preferences updated!";
}
```

## Architecture

The plugin uses two internal contexts with different lifecycles:

### Client Context (Static)

Set once when `auth0Provider()` is called at startup. Contains:
- `config` - Auth0 configuration
- `apiClient` - Auth0 API client for token verification
- `managementClient` - Auth0 Management API client (if `management.enable: true`)

This context is shared across all requests and never changes after initialization.

### Session Context (Per-Request)

Updated on every authenticated request. Contains:
- `authInfo` - The authenticated user's token info, scopes, and claims

This context is set after token verification in the middleware and is unique to each request.

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
4. Enable **RBAC** and **Add Permissions in the Access Token**
5. Go to **Permissions** tab and add your tool permissions:
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

### Step 6: Create an Application

1. Go to **Auth0 Dashboard** → **Applications** → **Applications**
2. Click **Create Application** → **Machine to Machine Applications**
3. Name it (e.g., `MCP Server`)
4. Select your API (e.g., `MCP Server API`)
5. Copy the **Client ID** and **Client Secret** to your `.env`

### Step 7 (Optional): Enable Management API

Only needed if you want to use `getManagement()` for admin operations.

1. In your M2M application, go to **APIs** tab
2. Enable **Auth0 Management API**
3. Grant the permissions you need (e.g., `read:users`, `update:users`)
4. Update your middleware:

```typescript
export default auth0Provider({
  domain: process.env.AUTH0_DOMAIN!,
  audience: process.env.AUTH0_AUDIENCE!,
  baseURL: process.env.BASE_URL!,
  clientId: process.env.AUTH0_CLIENT_ID!,
  clientSecret: process.env.AUTH0_CLIENT_SECRET!,
  management: {
    enable: true,
  },
});
```

### Important Notes

- **API Identifier must match BASE_URL**: MCP clients send a `resource` parameter that Auth0 uses as the audience. If there's a mismatch (even a missing trailing slash), you'll get "Service not found" errors.
- **Trailing slash matters**: If your `BASE_URL` is `http://localhost:3001`, the MCP client may send `http://localhost:3001/` as the resource. Create your API with the trailing slash to match.
- **DCR clients are third-party**: They require domain-level connections to authenticate users.
- **RBAC must be enabled**: Enable "Add Permissions in the Access Token" in your API settings for permission enforcement to work.

### Environment Variables

After setup, configure your `.env`:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=http://localhost:3001/
BASE_URL=http://localhost:3001
AUTH0_CLIENT_ID=your-client-id
AUTH0_CLIENT_SECRET=your-client-secret
```
