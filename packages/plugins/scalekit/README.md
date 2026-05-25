# @xmcp-dev/scalekit

Scalekit OAuth 2.1 authentication plugin for [xmcp](https://xmcp.dev).

Scalekit is a purpose-built authorization server for MCP. It supports Dynamic Client Registration (DCR), Client ID Metadata Documents (CIMD), and OAuth 2.1 with PKCE out of the box — everything MCP clients need to authenticate.

## Installation

```bash
pnpm i @xmcp-dev/scalekit
```

## Setup

### 1. Configure Scalekit

1. Go to your [Scalekit Dashboard](https://app.scalekit.com)
2. Navigate to **MCP Auth** and register a new MCP server resource
3. Save your environment URL, client ID, and client secret

### 2. Add the provider

```typescript
// src/middleware.ts
import { scalekitProvider } from "@xmcp-dev/scalekit";

export default scalekitProvider({
  environmentUrl: process.env.SCALEKIT_ENVIRONMENT_URL!,
  clientId: process.env.SCALEKIT_CLIENT_ID!,
  clientSecret: process.env.SCALEKIT_CLIENT_SECRET!,
  baseURL: process.env.BASE_URL!,
});
```

### 3. Access the session

```typescript
// src/tools/whoami.ts
import type { ToolMetadata } from "xmcp";
import { getSession } from "@xmcp-dev/scalekit";

export const metadata: ToolMetadata = {
  name: "whoami",
  description: "Returns session info",
};

export default function whoami(): string {
  const session = getSession();
  return JSON.stringify({ userId: session.userId, scopes: session.scopes }, null, 2);
}
```

## API

### `scalekitProvider(config)`

Returns the xmcp `Middleware` object (`{ middleware, router }`).

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `environmentUrl` | `string` | Yes | Scalekit environment URL |
| `clientId` | `string` | Yes | Scalekit client ID |
| `clientSecret` | `string` | Yes | Scalekit client secret |
| `baseURL` | `string` | Yes | Your MCP server's public URL |
| `resourceId` | `string` | No | Scalekit resource ID |
| `scopes` | `string[]` | No | Scopes to advertise |
| `docsURL` | `string` | No | Documentation URL |

### `getSession()`

Returns the authenticated user's `Session` object within a tool handler.

### `getClient()`

Returns the initialized Scalekit Node SDK client for advanced operations.

## Documentation

Full documentation: [xmcp.dev/docs/integrations/scalekit](https://xmcp.dev/docs/integrations/scalekit)