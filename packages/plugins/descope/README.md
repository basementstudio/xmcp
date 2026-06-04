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
  projectId: process.env.DESCOPE_PROJECT_ID!,
  mcpServerId: process.env.DESCOPE_MCP_SERVER_ID!,
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
DESCOPE_PROJECT_ID=your-descope-project-id
DESCOPE_MCP_SERVER_ID=your-mcp-server-id
BASE_URL=http://127.0.0.1:3001
```

## Descope Setup

### 1. Create a Project

If you don't have one, create a project at [app.descope.com](https://app.descope.com). Copy the **Project ID** from the project settings.

### 2. Create an Agentic MCP Server

1. Go to **Descope Console** → **Agentic Identity Hub** → **MCP Servers**
2. Click **Create MCP Server**
3. Set a name and your server's base URL
4. Copy the **MCP Server ID**

The MCP Server ID wires your xmcp server to Descope's agentic OAuth endpoints, which MCP clients use for Dynamic Client Registration and token exchange.

## API Reference

### `descopeProvider(config)`

Creates the Descope authentication provider for xmcp. Returns `{ middleware, router }`.

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `projectId` | `string` | Yes | Your Descope project ID |
| `mcpServerId` | `string` | Yes | The MCP server ID from the Descope console |
| `baseURL` | `string` | Yes | The base URL of your MCP server |
| `managementKey` | `string` | No | Descope management key — required to use `getUser()` or `getManagementClient()` |
| `scopesSupported` | `string[]` | No | Scopes advertised in OAuth metadata (default: `["openid", "profile", "email"]`) |

### `getSession()`

Returns the authenticated user's session for the current request. Throws if called outside of middleware context.

```typescript
import { getSession } from "@xmcp-dev/descope";

const session = getSession();
session.userId       // Descope user ID
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

## OAuth Endpoints

The plugin serves two OAuth metadata endpoints used by MCP clients during the authorization flow:

- `GET /.well-known/oauth-protected-resource` — Resource server metadata
- `GET /.well-known/oauth-authorization-server` — Proxies Descope's OIDC discovery document
