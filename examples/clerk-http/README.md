# Get started with Clerk on xmcp

### 1. Install the plugin

```bash
npm install @xmcp-dev/clerk
```

### 2. Set up your Clerk account

1. Navigate to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Enter to an existing application or create a new one
3. Go to **Configure** and access to **API Keys** to get the following values:
   - **Secret Key** (`sk_...`)
   - **Frontend API** URL (`your-app.clerk.accounts.dev`)
4. Click on **Development**, enter to **OAuth Applications** and enable **Dynamic Client Registration**

### 3. Create environment variables

Create a `.env` file in the root of your project and configure the following environment variables:

```bash
CLERK_SECRET_KEY=sk_...
CLERK_DOMAIN=your-app.clerk.accounts.dev

BASE_URL=http://127.0.0.1:3001 
```

The `BASE_URL` shown above is for local development. In production, replace it with your deployed server URL.

### 4. Create the middleware

Create a `middleware.ts` file in your xmcp app's `src` directory and import the provider from the package:

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
| `baseURL` | `string` | Base URL of your MCP server (use `http://127.0.0.1:3001` for development, your production URL in production) | Yes |
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

Access tokens are short-lived. The client should automatically refresh. If it persists:
- Disconnect and reconnect in the MCP client
- Check that your system clock is accurate

### "Token verification failed"

- Verify your `CLERK_SECRET_KEY` is correct
- Verify your `CLERK_DOMAIN` matches your Clerk application's Frontend API
- Make sure you're using the right environment (test vs production)

## Learn More

- [xmcp Clerk Plugin Docs](https://xmcp.dev/docs/integrations/clerk)
- [Clerk Documentation](https://clerk.com/docs)