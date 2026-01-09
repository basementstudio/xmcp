# Get started with Clerk on xmcp

> [!IMPORTANT]
> This example shows how to add authentication to your xmcp app using [Clerk](https://clerk.com). Clerk handles all the OAuth complexity, so your MCP server only needs to validate tokens.

## Quick Start

### 1. Install the plugin

```bash
npm install @xmcp-dev/clerk
```

### 2. Set up your Clerk account

1. Go to [Clerk Dashboard](https://dashboard.clerk.com) and create an application (or use an existing one)
2. Copy your **Secret Key** (starts with `sk_test_` or `sk_live_`)
3. Copy your **Frontend API** URL (e.g., `your-app.clerk.accounts.dev`)
4. Navigate to **OAuth Applications** and enable **Dynamic Client Registration**
   - This allows MCP clients like Cursor and Claude to automatically connect

### 3. Create environment variables

Create a `.env` file in your project root with the following vars:

```bash
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

CLERK_DOMAIN=your-app.clerk.accounts.dev

BASE_URL=http://127.0.0.1:3001
```

### 4. Create the middleware

Create `src/middleware.ts`:

```typescript
import { clerkProvider } from "@xmcp-dev/clerk";

export default clerkProvider({
  secretKey: process.env.CLERK_SECRET_KEY!,
  clerkDomain: process.env.CLERK_DOMAIN!,
  baseURL: process.env.BASE_URL!,
});
```

### 5. Run the server

```bash
# Development
pnpm dev

# Production
pnpm build
pnpm start
```

## Configuration Options

| Option | Type | Description | Required |
|--------|------|-------------|----------|
| `secretKey` | `string` | Clerk Secret Key from dashboard | Yes |
| `clerkDomain` | `string` | Clerk Frontend API domain | Yes |
| `baseURL` | `string` | Base URL of your MCP server | Yes |
| `scopes` | `string[]` | OAuth scopes to request (default: `['profile', 'email']`) | No |
| `docsURL` | `string` | URL to your API documentation | No |

## Using Authentication in Tools

Access the authenticated user's session in your tools:

```typescript
import { getSession, getUser } from "@xmcp-dev/clerk";

export default async function myTool() {
  // Get session data
  const session = getSession();
  console.log(session.userId);
  console.log(session.organizationId);

  // Get full user profile
  const user = await getUser();
  console.log(user.firstName);
  console.log(user.emailAddresses[0]?.emailAddress);
}
```

### Session Properties

| Property | Type | Description |
|----------|------|-------------|
| `userId` | `string` | Unique user identifier |
| `sessionId` | `string \| undefined` | Current session ID |
| `organizationId` | `string \| undefined` | Organization ID (if in an org) |
| `organizationRole` | `string \| undefined` | Role in the organization |
| `organizationPermissions` | `string[] \| undefined` | Organization permissions |
| `expiresAt` | `Date` | Token expiration time |
| `issuedAt` | `Date` | Token issue time |

## Example Tools

This example includes three tools:

1. **whoami** - Returns basic identity information from the session
2. **greet** - Greets a person by name and shows your identity
3. **get-user-info** - Fetches full user profile from Clerk API


## Troubleshooting

### "Missing or invalid bearer token"

The client isn't sending a token. Make sure:
- Dynamic Client Registration is enabled in Clerk
- The client completed the OAuth flow

### "Token has expired"

Access tokens are short-lived (~5 minutes). The client should automatically refresh. If it persists:
- Disconnect and reconnect in the MCP client
- Check that your system clock is accurate

### "Token verification failed"

- Verify your `CLERK_SECRET_KEY` is correct
- Verify your `CLERK_DOMAIN` matches your Clerk application's Frontend API
- Make sure you're using the right environment (test vs production)

## Learn More

- [xmcp Clerk Plugin Docs](https://xmcp.dev/docs/integrations/clerk)
- [Clerk Documentation](https://clerk.com/docs)