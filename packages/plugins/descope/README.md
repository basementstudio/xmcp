# @xmcp-dev/descope

Descope authentication integration for [xmcp](https://xmcp.dev).

## Installation

```bash
npm install @xmcp-dev/descope
# or
pnpm add @xmcp-dev/descope
# or
yarn add @xmcp-dev/descope
```

## Quick Start

### 1. Configure the Descope Provider

Create a `src/middleware.ts` file:

```typescript
import { descopeProvider } from "@xmcp-dev/descope";

export default descopeProvider({
  issuerURL: process.env.DESCOPE_ISSUER_URL!,
  baseURL: process.env.BASE_URL!,
});
```

### 2. Access Session Info in Tools

```typescript
// src/tools/whoami.ts
import { getSession } from "@xmcp-dev/descope";
import type { ToolMetadata } from "xmcp";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Get current user info",
};

export default function whoami() {
  const session = getSession();
  return `User ID: ${session.userId}, Expires: ${session.expiresAt.toISOString()}`;
}
```

### 3. Environment Variables

```bash
DESCOPE_ISSUER_URL=https://api.descope.com/your-project-id/your-audience
BASE_URL=http://127.0.0.1:3001
```

## Descope Setup

### 1. Create an MCP Server Resource

1. Go to **Descope Console** → **Agentic Identity Hub** → **Resources**
2. Click **Create Resource** → **MCP Server**
3. Set a name and your server's base URL
4. Copy the **Issuer URL**

The issuer URL identifies your resource and contains your project ID. The plugin parses both from it automatically, so you only need the one value.

## API Reference

### `descopeProvider(config)`

Creates the Descope authentication provider for xmcp. Returns `{ middleware, router }`.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `issuerURL` | `string` | Yes | Issuer URL from your MCP Server resource in the Descope Console |
| `baseURL` | `string` | Yes | The base URL of your MCP server |
| `managementKey` | `string` | No | Descope management key — required to use `getUser()` or `getManagementClient()` |
| `scopesSupported` | `string[]` | No | Scopes advertised in OAuth metadata (default: `["openid", "profile", "email"]`) |

### `getSession()`

Returns the authenticated user's session for the current request. Throws if called outside of middleware context.

```typescript
import { getSession } from "@xmcp-dev/descope";

const session = getSession();
session.userId       // Descope user ID
session.email        // Email address from JWT claims
session.loginIds     // Login identifiers (email, phone, etc.)
session.permissions  // Permissions granted to this session
session.roles        // Roles assigned to the user
session.tenants      // Tenant memberships with per-tenant permissions and roles
session.expiresAt    // Token expiry as a Date
session.issuedAt     // Token issue time as a Date
session.claims       // Raw JWT claims
```

### `getUser()`

Fetches full user details from the Descope Management API. Requires `managementKey` to be configured.

```typescript
import { getUser } from "@xmcp-dev/descope";

export default async function whoami() {
  const user = await getUser();
  return JSON.stringify(user, null, 2);
}
```

### `getClient()`

Returns the Descope SDK client for advanced operations.

```typescript
import { getClient } from "@xmcp-dev/descope";

const client = getClient();
```

### `getManagementClient()`

Returns the Descope management API client. Requires `managementKey` to be configured.

```typescript
import { getManagementClient } from "@xmcp-dev/descope";

const mgmt = getManagementClient();
await mgmt.user.loadByUserId(userId);
```

### `fetchConnectionToken(appId)`

Fetches a connection token for the authenticated user using their own bearer token — no management key required. The user's access token must include the `outbound.token.fetch` scope.

```typescript
import { fetchConnectionToken } from "@xmcp-dev/descope";

const accessToken = await fetchConnectionToken("github");
```

## OAuth Endpoints

The plugin serves two OAuth metadata endpoints used by MCP clients during the authorization flow:

- `GET /.well-known/oauth-protected-resource` — Resource server metadata
- `GET /.well-known/oauth-authorization-server` — Proxies Descope's OIDC discovery document
