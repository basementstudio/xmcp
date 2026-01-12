# @xmcp-dev/clerk

Clerk authentication integration for xmcp MCP servers.

## Installation

```bash
npm install @xmcp-dev/clerk
```

## Quick Start

1. **Set up environment variables:**

```bash
CLERK_SECRET_KEY=sk_...
CLERK_DOMAIN=your-app.clerk.accounts.dev

BASE_URL=http://127.0.0.1:3001 
```

The `BASE_URL` in production should be replaced with your deployed server URL.

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
| `baseURL` | `string` | Yes | Base URL of your MCP server (development: `http://127.0.0.1:3001`, production: your deployed URL) |
| `scopes` | `string[]` | No | OAuth scopes (default: `['profile', 'email']`) |
| `docsURL` | `string` | No | URL to your API documentation |

## Clerk Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application or select an existing one
3. Navigate to **Configure** and go to **API Keys**, note your :
   1. **Secret Key** (`sk_test_` for development / `sk_live_` for production)
   2. **Frontend API** URL (`your-app.clerk.accounts.dev`)
4. Click on **Development**, enter to OAuth Applications and enable **Dynamic Client Registration**

## API

### `clerkProvider(config)`

Creates the middleware and router for Clerk authentication.

### `getSession()`

Returns the current user's session data.

### `getUser()`

Fetches the full user profile from Clerk's.

### `getClient()`

Returns the Clerk Backend SDK client.

## Documentation

For full documentation, visit [xmcp Clerk Plugin](https://xmcp.dev/docs/integrations/clerk).

## Contributing

See the main [xmcp repository](https://github.com/basementstudio/xmcp) for contribution guidelines.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).

