# @xmcp-dev/workos

[WorkOS](https://workos.com) AuthKit integration plugin for xmcp.

## Get started

> [!IMPORTANT]
> This plugin adds authentication to your xmcp app using WorkOS AuthKit. AuthKit is a hosted OAuth authorization server - no database required on your end.


To integrate WorkOS to your xmcp app, you need to:

1. Install the plugin

```bash
npm install @xmcp-dev/workos
```

2. Set up your WorkOS account at [workos.com](https://workos.com). You'll need:
   - API Key (starts with `sk_`)
   - Client ID (starts with `client_`)
   - AuthKit domain (e.g., `yourcompany.authkit.app`)

Make sure to enable **Client ID Metadata Document** in your WorkOS Dashboard under Connect → Configuration.

3. Create a `.env` file in your xmcp app root directory and add the following environment variables:

```
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=yourcompany.authkit.app

BASE_URL=http://127.0.0.1:3002
```

4. Create a `middleware.ts` file in your xmcp app root directory and import the `workosProvider`

```ts
import { workosProvider } from "@xmcp-dev/workos";

export default workosProvider({
  apiKey: process.env.WORKOS_API_KEY!,
  clientId: process.env.WORKOS_CLIENT_ID!,
  authkitDomain: process.env.WORKOS_AUTHKIT_DOMAIN!,
  baseURL: process.env.BASE_URL || "http://127.0.0.1:3002",
});
```

This config object is used to configure the WorkOS provider.

| Parameter        | Type     | Description                                                              | Required |
| ---------------- | -------- | ------------------------------------------------------------------------ | -------- |
| `apiKey`         | `string` | WorkOS API key from your dashboard                                       | Yes      |
| `clientId`       | `string` | WorkOS client ID for OAuth                                               | Yes      |
| `authkitDomain`  | `string` | Your AuthKit domain (e.g., `yourcompany.authkit.app`)                    | Yes      |
| `baseURL`        | `string` | Base URL of your xmcp app. Used to construct redirect URIs               | Yes      |

## Access the session in your tools

Use the `getWorkOSSession` function to get the current session in your tools. This function will throw an error if it is used outside of a `workosProvider` middleware, since session will be null.

```ts
import { getWorkOSSession } from "@xmcp-dev/workos";

export default async function greet({ name }: { name: string }) {
  const session = await getWorkOSSession();

  return `Hello, ${name}! Your email is ${session.user.email}`;
}
```

The session includes the user's profile information fetched from WorkOS User Management API:

- `user.id` - Unique user identifier
- `user.email` - User's email address
- `user.firstName` / `user.lastName` - User's name (if available)
- `user.emailVerified` - Whether the email is verified
- `organizationId` - Organization ID (if using WorkOS Organizations)

Authentication is handled entirely by WorkOS AuthKit's hosted UI. MCP clients will be redirected to AuthKit for login and receive a JWT access token to use with your server.

## Contributing

See the main [xmcp repository](https://github.com/basementstudio/xmcp) for contribution guidelines.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
