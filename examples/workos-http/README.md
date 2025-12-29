# Get started with WorkOS on xmcp

> [!IMPORTANT]
> This example shows how to add authentication to your xmcp app using WorkOS AuthKit. AuthKit provides a hosted OAuth 2.0 authorization server with SSO support.

To integrate WorkOS to your xmcp app, you need to:

1. Install the plugin

```bash
npm install @xmcp-dev/workos
```

2. Set up your WorkOS account:
   - Create a [WorkOS account](https://workos.com)
   - Configure AuthKit in your dashboard
   - Enable **Client ID Metadata Document** in Connect → Configuration

3. Create a `.env` file in your xmcp app root directory:

```env
# WorkOS API Key (starts with "sk_")
WORKOS_API_KEY=sk_test_...

# WorkOS Client ID (starts with "client_")
WORKOS_CLIENT_ID=client_...

# Your AuthKit domain (without https://)
WORKOS_AUTHKIT_DOMAIN=yourcompany.authkit.app

# Base URL of your MCP server
BASE_URL=http://127.0.0.1:3002
```

4. Create a `middleware.ts` file in your xmcp app root directory and import the `workosProvider`

```tsx
import { workosProvider } from "@xmcp-dev/workos";

export default workosProvider({
  apiKey: process.env.WORKOS_API_KEY!,
  clientId: process.env.WORKOS_CLIENT_ID!,
  authkitDomain: process.env.WORKOS_AUTHKIT_DOMAIN!,
  baseURL: process.env.BASE_URL || "http://127.0.0.1:3002",
});
```

This config object is used to configure the WorkOS provider.

| Parameter        | Type     | Description                                                    | Required |
| ---------------- | -------- | -------------------------------------------------------------- | -------- |
| `apiKey`         | `string` | WorkOS API key from dashboard (starts with `sk_`)              | Yes      |
| `clientId`       | `string` | WorkOS client ID for OAuth (starts with `client_`)             | Yes      |
| `authkitDomain`  | `string` | Your AuthKit domain (e.g., `yourcompany.authkit.app`)          | Yes      |
| `baseURL`        | `string` | Base URL of your MCP server for OAuth callbacks                | Yes      |

## Access the session in your tools

Use the `getWorkOSSession` function to get the current session in your tools. This function will throw an error if it is used outside of a `workosProvider` middleware, since session will be null.

```ts
import { getWorkOSSession } from "@xmcp-dev/workos";

export default async function getMySession() {
  const session = await getWorkOSSession();

  return `Your user id is ${session.user.id} and email is ${session.user.email}`;
}
```

The session includes:
- `user.id` - WorkOS user ID
- `user.email` - User's email address
- `user.firstName` / `user.lastName` - User's name (if available)
- `organizationId` - Organization ID (if using organizations)

## How it works

The WorkOS plugin delegates all OAuth functionality to WorkOS AuthKit:

1. **Modern MCP clients** discover AuthKit via `/.well-known/oauth-protected-resource`
2. **Users authenticate** through WorkOS AuthKit's hosted UI
3. **Access tokens** are verified using AuthKit's JWKS endpoint
4. **User info** is fetched from WorkOS User Management API

## Troubleshooting

### "No token provided" error

The MCP endpoint requires authentication. MCP clients will automatically handle the OAuth flow.

### Token verification fails

- Ensure your `WORKOS_AUTHKIT_DOMAIN` is correct
- Check that the access token was issued by your AuthKit domain
- Tokens expire - get a fresh token if needed

### MCP client can't discover authorization server

1. Enable **Client ID Metadata Document** in WorkOS Dashboard (Connect → Configuration)
2. Verify the `/.well-known/oauth-protected-resource` endpoint returns correct metadata
