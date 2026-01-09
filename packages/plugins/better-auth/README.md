# @xmcp-dev/better-auth

[Better Auth](https://github.com/better-auth/better-auth) integration plugin for xmcp.

## Get started

> [!IMPORTANT]
> This example shows how to add authentication to your xmcp app using Better Auth and a PostgreSQL database. This is currently the only supported DB provider for this plugin.
> It only protects the `/mcp` endpoint.

To integrate Better Auth to your xmcp app, you need to:

1. Install the plugin and PostgreSQL dependencies

```bash
npm install @xmcp-dev/better-auth pg
```

You will also need to install the `pg` types as dev dependency:

```bash
npm install -D @types/pg
```

2. Create a PostgreSQL database with the [OIDC Provider schema](https://www.better-auth.com/docs/plugins/oidc-provider#schema). If you prefer, you can use the following script to create the tables on your DB:

The generation of schema through better-auth's CLI is not supported yet.

```sql
create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamp not null, "updatedAt" timestamp not null);

create table "session" ("id" text not null primary key, "expiresAt" timestamp not null, "token" text not null unique, "createdAt" timestamp not null, "updatedAt" timestamp not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id"));

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id"), "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamp, "refreshTokenExpiresAt" timestamp, "scope" text, "password" text, "createdAt" timestamp not null, "updatedAt" timestamp not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamp not null, "createdAt" timestamp, "updatedAt" timestamp);

create table "oauthApplication" ("id" text not null primary key, "name" text not null, "icon" text, "metadata" text, "clientId" text not null unique, "clientSecret" text, "redirectURLs" text not null, "type" text not null, "disabled" boolean, "userId" text, "createdAt" timestamp not null, "updatedAt" timestamp not null);

create table "oauthAccessToken" ("id" text not null primary key, "accessToken" text not null unique, "refreshToken" text not null unique, "accessTokenExpiresAt" timestamp not null, "refreshTokenExpiresAt" timestamp not null, "clientId" text not null, "userId" text, "scopes" text not null, "createdAt" timestamp not null, "updatedAt" timestamp not null);

create table "oauthConsent" ("id" text not null primary key, "clientId" text not null, "userId" text not null, "scopes" text not null, "createdAt" timestamp not null, "updatedAt" timestamp not null, "consentGiven" boolean not null);

```

For a seamless experience, we recommend setting up the database on Neon using Vercel's storage integration.

3. Create a `.env` file in your xmcp app root directory and add the following environment variables:

```
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_BASE_URL=<base-url>
```

4. Create a `middleware.ts` file in your xmcp app root directory and import the `betterAuthProvider`

```tsx
import { betterAuthProvider } from "@xmcp-dev/better-auth";
import { Pool } from "pg";

export default betterAuthProvider({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://127.0.0.1:3002",
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key",
  providers: {
    emailAndPassword: true,
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
```

This config object is used to configure the Better Auth instance through the provider function.

| Parameter                       | Type                   | Description                                                                                            | Required                 |
| ------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| `database`                      | `Pool` (from `pg`)     | Must be a valid instance of `Pool` for PostgreSQL connection                                           | Yes                      |
| `baseURL`                       | `string`               | The base URL of your xmcp app. Used to generate OAuth callback URLs. Should match your app's host/port | Yes                      |
| `secret`                        | `string`               | Secret used to sign JWT tokens. Generate a random secret for security                                  | Yes                      |
| `providers`                     | `object`               | Configuration object for authentication providers                                                      | No                       |
| `providers.emailAndPassword`    | `boolean`              | Set to `true` to enable email/password authentication                                                  | No                       |
| `providers.google`              | `object`               | Google OAuth configuration object                                                                      | No                       |
| `providers.google.clientId`     | `string`               | Google OAuth client ID from Google Cloud Console                                                       | Required if using Google |
| `providers.google.clientSecret` | `string`               | Google OAuth client secret from Google Cloud Console                                                   | Required if using Google |
| `plugins`                       | `BetterAuthPlugin[]`   | Custom Better Auth plugins (e.g., genericOAuth). See [Custom OAuth Providers](#custom-oauth-providers-advanced) | No                       |

#### Email and Password

To enable the `emailAndPassword` provider, you need to set the `emailAndPassword` property to `true`.

```ts
const config: BetterAuthConfig = {
  ...config, // your existing config
  providers: {
    emailAndPassword: true,
  },
};
```

#### Google

To enable the `google` provider, you need to set the `google` property to an object with the `clientId` and `clientSecret` properties.

```ts
const config: BetterAuthConfig = {
  ...config, // your existing config
  providers: {
    google: {
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
    },
  },
};
```

Your client_id and client_secret can be found in the [Google Cloud Console](https://console.cloud.google.com/apis/dashboard). These should be added as environment variables in your .env file.

Make sure to set the redirect URL in the Google Cloud Console > Credentials > Authorized redirect URIs, to `http://host:port/auth/callback/google` for local development. For production, make sure to set the redirect URL as your application domain, e.g. `https://example.com/auth/callback/google`. If you change the base path of the auth routes, you should update the redirect URL accordingly.

You can combine both providers if you want.

```ts
const config: BetterAuthConfig = {
  ...config, // your existing config
  providers: {
    emailAndPassword: true,
    google: {
      clientId: "your-client-id",
      clientSecret: "your-client-secret",
    },
  },
};
```

## Custom OAuth Providers (Advanced)

For advanced use cases like custom authorization URLs (e.g., SSO proxy) or unsupported OAuth providers, you can pass your own Better Auth plugins using the `plugins` option.

This lets you have full control over OAuth configuration while keeping all the conveniences of this wrapper (sign-in UI, middleware, session management).

```ts
import { betterAuthProvider } from "@xmcp-dev/better-auth";
import { genericOAuth } from "better-auth/plugins/generic-oauth";
import { Pool } from "pg";

// Create your custom OAuth provider with full control
const googleOAuth = genericOAuth({
  config: [
    {
      providerId: "google",
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // Custom authorization URL (e.g., through SSO proxy)
      authorizationUrl:
        "https://sso-proxy.example.com/proxy/https://accounts.google.com/o/oauth2/v2/auth",
      // Token and userinfo go directly to Google
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
      scopes: ["openid", "email", "profile"],
      pkce: true,
      mapProfileToUser: (profile) => ({
        id: profile.sub as string,
        email: profile.email as string,
        name: profile.name as string,
        image: profile.picture as string,
        emailVerified: profile.email_verified as boolean,
      }),
    },
  ],
});

export default betterAuthProvider({
  database: new Pool({
    connectionString: process.env.DATABASE_URL,
  }),
  baseURL: process.env.BETTER_AUTH_BASE_URL || "http://127.0.0.1:3002",
  secret: process.env.BETTER_AUTH_SECRET || "super-secret-key",
  // Pass your custom plugin - the MCP plugin is always included automatically
  plugins: [googleOAuth],
});
```

### Use Cases for Custom Plugins

- **SSO Proxy**: Route OAuth through a central proxy that handles `redirect_uri` rewriting for multiple environments
- **Custom OAuth Providers**: Add support for OAuth providers not built into Better Auth
- **Advanced Configuration**: Full control over scopes, PKCE, profile mapping, etc.

### How It Works

When you provide the `plugins` option:

1. The MCP plugin is always included automatically (for MCP client authentication)
2. Your custom plugins are added alongside the MCP plugin
3. The built-in `providers.google` configuration is ignored (your plugin handles OAuth)
4. The sign-in UI, middleware, and session management continue to work normally
5. OAuth callbacks are handled for any provider ID (e.g., `/auth/callback/google`, `/auth/callback/github`)

## Access the session in your tools

Use the `getBetterAuthSession` function to get the current session in your tools. This function will throw an error if it is used outside of a `betterAuthProvider` middleware, since session will be null.

```ts
import { getBetterAuthSession } from "@xmcp-dev/better-auth";

export default async function getMySession() {
  const session = await getBetterAuthSession();

  return `Your user id is ${session.userId}`;
}
```

The login page will be available at `http://host:port/auth/sign-in` and is automatically generated by the config you passed to the provider function. It is also the same page for signing up.

## License

MIT - See [LICENSE](https://github.com/basementstudio/xmcp/blob/main/LICENSE) file for details.

## Contributing

See the main [xmcp repository](https://github.com/basementstudio/xmcp) for contribution guidelines.

## Questions

For help, use [Discord](https://discord.gg/d9a7JBBxV9). For security issues, email [security@xmcp.dev](mailto:security@xmcp.dev).
