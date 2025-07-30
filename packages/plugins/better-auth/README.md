# @xmcp-dev/better-auth

[Better Auth](https://github.com/better-auth/better-auth) integration plugin for xmcp.

## Installation

```bash
npm install @xmcp-dev/better-auth
```

## Usage

### Basic Setup

```typescript
// src/middleware.ts
import { betterAuthProvider } from "@xmcp-dev/better-auth";
import { Pool } from "pg";

const auth = {
  database: new Pool({
    connectionString: "your-postgres-connection-string",
  }),
  baseUrl: "http://127.0.0.1:3002", // your xmcp server url
  secret: "your-secret-key",
  emailAndPassword: {
    enabled: true,
  },
};

export default [betterAuthProvider(auth)];
```

### Session Management

```typescript
import { getBetterAuthSession } from "@xmcp-dev/better-auth";

// In your MCP tools
export async function protectedTool() {
  const session = getBetterAuthSession();

  if (!session) {
    throw new Error("Authentication required");
  }

  // Tool logic here
  return { ... };
}
```

## Configuration

### BetterAuthConfig

| Property                   | Type      | Required | Description                          |
| -------------------------- | --------- | -------- | ------------------------------------ |
| `database`                 | `Pool`    | Yes      | PostgreSQL connection pool           |
| `baseURL`                  | `string`  | Yes      | Base URL for your application        |
| `secret`                   | `string`  | Yes      | Secret key for session encryption    |
| `emailAndPassword`         | `object`  | Yes      | Email/password configuration         |
| `emailAndPassword.enabled` | `boolean` | Yes      | Enable email/password authentication |

## API Reference

### Functions

#### `betterAuthProvider(config: BetterAuthConfig): XmcpMiddleware`

Creates a complete Better Auth provider with middleware and router that is injected to the HTTP transport.

#### `getBetterAuthSession(): OAuthAccessToken | null`

Gets the current user session.

## Authentication UI

The package includes a pre-built React application for authentication:

- Sign-in page at `/auth/sign-in`
- Sign-up page at `/auth/sign-up`

These routes are not customizable and are auto generated based on the providers configuration.

## License

MIT - See LICENSE file for details.

## Contributing

See the main xmcp repository for contribution guidelines.

## Questions

For help, use [Discord](https://discord.gg/DzsXJcUmQN). For security issues, email [security@basement.studio](mailto:security@basement.studio).
