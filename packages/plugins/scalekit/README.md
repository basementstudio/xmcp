# @xmcp-dev/scalekit

Scalekit authentication integration for [xmcp](https://xmcp.dev). Enables OAuth 2.1 authentication for MCP clients using Scalekit as the authorization server.

## Installation

```bash
npm install @xmcp-dev/scalekit
# or
pnpm add @xmcp-dev/scalekit
```

## Scalekit Setup

Before using this plugin, configure your Scalekit environment:

1. Go to your [Scalekit Dashboard](https://app.scalekit.com).
2. Navigate to **Auth for SaaS** → **MCP Auth** and [register a new MCP server resource](https://docs.scalekit.com/authenticate/mcp/quickstart/).
3. Go to **Settings** → **API Credentials** and save your **Environment URL**, **Client ID**, and **Client Secret**.

Scalekit automatically enables **Dynamic Client Registration (DCR)** and **Client ID Metadata Documents (CIMD)** for MCP clients.

## Usage

### 1. Configure the middleware

Create a `middleware.ts` file in your xmcp project:

```typescript
import { scalekitProvider } from "@xmcp-dev/scalekit";

export default scalekitProvider({
  environmentUrl: process.env.SCALEKIT_ENVIRONMENT_URL!,
  clientId: process.env.SCALEKIT_CLIENT_ID!,
  clientSecret: process.env.SCALEKIT_CLIENT_SECRET!,
  baseURL: process.env.BASE_URL!,
});
```

### 2. Environment Variables

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=skcs_...

BASE_URL=http://127.0.0.1:3001
```

### 3. Access Session in Tools

```typescript
import { getSession, getClient } from "@xmcp-dev/scalekit";

export default async function myTool() {
  // Get session data from JWT (fast, no API call)
  const session = getSession();
  console.log(session.userId);
  console.log(session.organizationId);
  console.log(session.scopes);

  // Get the Scalekit SDK client for advanced operations
  const client = getClient();

  return `Hello! Your user ID is ${session.userId}`;
}
```

## API Reference

### `scalekitProvider(config)`

Creates the Scalekit middleware and router for xmcp.

**Config:**
- `environmentUrl` - Scalekit environment URL
- `clientId` - Scalekit client ID
- `clientSecret` - Scalekit client secret
- `baseURL` - Base URL of your MCP server
- `resourceId` - (Optional) Scalekit resource ID for resource-specific OAuth metadata
- `scopes` - (Optional) Array of scopes to advertise
- `docsURL` - (Optional) URL for your MCP server documentation

### `getSession()`

Returns the current session from JWT claims. Throws if not authenticated.

**Returns:** `Session`
- `userId` - User ID (subject claim)
- `scopes` - Array of granted scopes
- `organizationId` - Organization ID, if present
- `expiresAt` - Token expiration date
- `issuedAt` - Token issued date
- `claims` - Raw JWT claims

### `getClient()`

Returns the initialized [Scalekit Node SDK](https://github.com/scalekit-inc/scalekit-sdk-node) client for advanced use cases.

## Using the Scalekit SDK

The `getClient()` function gives you access to the full Scalekit Node SDK, allowing you to leverage all Scalekit features in your MCP tools.

### Organization Details

```typescript
import { getSession, getClient } from "@xmcp-dev/scalekit";

export default async function myTool() {
  const session = getSession();
  const client = getClient();

  if (!session.organizationId) {
    return "No organization associated with this session.";
  }

  // Get organization details
  const { organization } = await client.organization.getOrganization(
    session.organizationId
  );

  return JSON.stringify(organization, null, 2);
}
```

### Token Lifecycle

- Access tokens are short-lived
- MCP clients automatically refresh tokens using refresh tokens
- If you see "token_expired" errors, the client should handle refresh automatically

## Example

See the [`scalekit-http` example](https://github.com/basementstudio/xmcp/tree/canary/examples/scalekit-http) for a complete working project.

## Documentation

Full documentation: [xmcp.dev/docs/integrations/scalekit](https://xmcp.dev/docs/integrations/scalekit)