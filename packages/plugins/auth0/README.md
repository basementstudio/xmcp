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
  scopesSupported: ["tool:greet", "tool:whoami"],
});
```

### 2. Protect Your Tools

#### Option A: Using `requireScopes` (Recommended for scope-based authorization)

```typescript
// src/tools/greet.ts
import { requireScopes } from "@xmcp-dev/auth0";
import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "greet",
  description: "Greet the authenticated user",
};

export default requireScopes(
  ["tool:greet"],
  async ({ name }, { authInfo }) => {
    return `Hello, ${authInfo.extra.name ?? name}!`;
  }
);
```

#### Option B: Using `getAuthInfo` (Like WorkOS pattern)

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
  return `User ID: ${authInfo.extra.sub}, Email: ${authInfo.extra.email}`;
}
```

### 3. Environment Variables

Create a `.env` file:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=http://localhost:3001/   # Must match API identifier exactly
BASE_URL=http://localhost:3001
```

## API Reference

### `auth0Provider(config)`

Creates the Auth0 authentication provider for xmcp.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `domain` | `string` | Yes | Your Auth0 domain |
| `audience` | `string` | Yes | The API identifier configured in Auth0 |
| `baseURL` | `string` | Yes | The base URL of your MCP server |
| `scopesSupported` | `string[]` | No | List of custom scopes |

### `requireScopes(scopes, handler)`

Higher-order function that wraps a tool handler with scope-based authorization.

```typescript
export default requireScopes(
  ["tool:read", "tool:write"],  // Required scopes
  async (params, { authInfo }) => {
    // authInfo is available here
    return "Success!";
  }
);
```

### `getAuthInfo()`

Gets the current user's authentication info from context.

```typescript
const authInfo = getAuthInfo();
console.log(authInfo.extra.sub);   // User ID
console.log(authInfo.extra.email); // Email
console.log(authInfo.scopes);      // Granted scopes
```

## Auth Info Structure

```typescript
interface AuthInfo {
  token: string;           // Raw access token
  clientId: string;        // OAuth client ID
  scopes: string[];        // Granted scopes
  expiresAt?: number;      // Expiration timestamp
  extra: {
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