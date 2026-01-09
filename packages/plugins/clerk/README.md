# @xmcp-dev/clerk

Clerk authentication integration for xmcp MCP servers.

## Installation

```bash
npm install @xmcp-dev/clerk
```

## Quick Start

1. **Set up environment variables:**

```bash
CLERK_SECRET_KEY=sk_test_...
CLERK_DOMAIN=your-app.clerk.accounts.dev
BASE_URL=http://127.0.0.1:3001
```

2. **Create middleware.ts:**

```typescript
import { clerkProvider } from "@xmcp-dev/clerk";

export default clerkProvider({
  secretKey: process.env.CLERK_SECRET_KEY!,
  clerkDomain: process.env.CLERK_DOMAIN!,
  baseURL: process.env.BASE_URL!,
});
```

3. **Use in tools:**

```typescript
import { getSession, getUser } from "@xmcp-dev/clerk";

export default async function myTool() {
  const session = getSession();
  const user = await getUser();
  
  return `Hello ${user.firstName}! Your ID is ${session.userId}`
}
```

## Configuration

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `secretKey` | `string` | Yes | Clerk Secret Key |
| `clerkDomain` | `string` | Yes | Clerk Frontend API domain |
| `baseURL` | `string` | Yes | Base URL of your MCP server |
| `scopes` | `string[]` | No | OAuth scopes (default: `['profile', 'email']`) |
| `docsURL` | `string` | No | URL to your API documentation |

## Clerk Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Copy your **Secret Key** and **Frontend API** URL from API Keys
3. Navigate to **OAuth Applications**
4. Enable **Dynamic Client Registration**

This allows MCP clients (Cursor, Claude, etc.) to automatically register themselves.

## API

### `clerkProvider(config)`

Creates the middleware and router for Clerk authentication.

### `getSession()`

Returns the current user's session data.

### `getUser()`

Fetches the full user profile from Clerk's API.

### `getClient()`

Returns the Clerk Backend SDK client for advanced operations.

## Documentation

For full documentation, visit [xmcp.dev/docs/integrations/clerk](https://xmcp.dev/docs/integrations/clerk).

## Contributing

See the main [xmcp repository](https://github.com/basementstudio/xmcp) for contribution guidelines.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).

