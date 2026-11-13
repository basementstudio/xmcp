# Get started with Better Auth on xmcp

> [!IMPORTANT]
> This example shows how to add authentication to your xmcp app using Better Auth and a PostgreSQL database. This is currently the only supported DB provider for this plugin.

To integrate Better Auth to your xmcp app, you need to:

1. Install the plugin and PostgreSQL dependencies

```bash
npm install @xmcp-dev/better-auth pg
```

You will also need to install the `pg` types as dev dependency:

```bash
npm install -D @types/pg
```

2. Create a PostgreSQL database with the [Better Auth core](https://www.better-auth.com/docs/concepts/database#core-schema), [JWT](https://www.better-auth.com/docs/plugins/jwt#schema) and [MCP](https://www.better-auth.com/docs/plugins/mcp) schemas. If you prefer, you can use the following script to create the tables on your DB:

The generation of schema through better-auth's CLI is not supported yet.

```sql
create table "user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "user" ("id") on delete cascade);

create table "account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null);

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create table "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz, "alg" text, "crv" text);

create table "oauthClient" ("id" text not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" boolean, "skipConsent" boolean, "enableEndSession" boolean, "subjectType" text, "scopes" jsonb, "clientCredentialsScopes" jsonb, "userId" text references "user" ("id") on delete cascade, "createdAt" timestamptz, "updatedAt" timestamptz, "name" text, "uri" text, "icon" text, "contacts" jsonb, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" jsonb not null, "postLogoutRedirectUris" jsonb, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" boolean, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" jsonb, "responseTypes" jsonb, "requirePKCE" boolean, "dpopBoundAccessTokens" boolean, "referenceId" text, "metadata" jsonb);

create table "oauthResource" ("id" text not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" jsonb, "customClaims" jsonb, "dpopBoundAccessTokensRequired" boolean, "disabled" boolean, "createdAt" timestamptz, "updatedAt" timestamptz, "policyVersion" integer, "metadata" jsonb);

create table "oauthClientResource" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "resourceId" text not null references "oauthResource" ("identifier") on delete cascade, "metadata" jsonb, "createdAt" timestamptz);

create table "oauthRefreshToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text not null references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "rotatedAt" timestamptz, "rotationReplayResponse" text, "rotationReplayExpiresAt" timestamptz, "authTime" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "oauthAccessToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "refreshId" text references "oauthRefreshToken" ("id") on delete cascade, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "oauthConsent" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "scopes" jsonb not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null);

create table "oauthClientAssertion" ("id" text not null primary key, "expiresAt" timestamptz not null);

create index "session_userId_idx" on "session" ("userId");
create index "account_userId_idx" on "account" ("userId");
create index "verification_identifier_idx" on "verification" ("identifier");
create index "oauthClient_userId_idx" on "oauthClient" ("userId");
create index "oauthClientResource_clientId_idx" on "oauthClientResource" ("clientId");
create index "oauthClientResource_resourceId_idx" on "oauthClientResource" ("resourceId");
create index "oauthRefreshToken_clientId_idx" on "oauthRefreshToken" ("clientId");
create index "oauthRefreshToken_sessionId_idx" on "oauthRefreshToken" ("sessionId");
create index "oauthRefreshToken_userId_idx" on "oauthRefreshToken" ("userId");
create index "oauthRefreshToken_authorizationCodeId_idx" on "oauthRefreshToken" ("authorizationCodeId");
create index "oauthAccessToken_clientId_idx" on "oauthAccessToken" ("clientId");
create index "oauthAccessToken_sessionId_idx" on "oauthAccessToken" ("sessionId");
create index "oauthAccessToken_userId_idx" on "oauthAccessToken" ("userId");
create index "oauthAccessToken_authorizationCodeId_idx" on "oauthAccessToken" ("authorizationCodeId");
create index "oauthAccessToken_refreshId_idx" on "oauthAccessToken" ("refreshId");
create index "oauthConsent_clientId_idx" on "oauthConsent" ("clientId");
create index "oauthConsent_userId_idx" on "oauthConsent" ("userId");
create unique index "oauthClientResource_clientId_resourceId_uidx" on "oauthClientResource" ("clientId", "resourceId");
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
    emailAndPassword: {
      enabled: true,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
});
```

This config object is used to configure the Better Auth instance through the provider function.

| Parameter                            | Type               | Description                                                                                            | Required                 |
| ------------------------------------ | ------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------ |
| `database`                           | `Pool` (from `pg`) | Must be a valid instance of `Pool` for PostgreSQL connection                                           | Yes                      |
| `baseURL`                            | `string`           | The base URL of your xmcp app. Used to generate OAuth callback URLs. Should match your app's host/port | Yes                      |
| `secret`                             | `string`           | Secret used to sign JWT tokens. Generate a random secret for security                                  | Yes                      |
| `providers`                          | `object`           | Configuration object for authentication providers                                                      | Yes                      |
| `providers.emailAndPassword`         | `object`           | Configuration object for email/password authentication                                                 | No                       |
| `providers.emailAndPassword.enabled` | `boolean`          | Set to `true` to enable email/password authentication                                                  | No                       |
| `providers.google`                   | `object`           | Google OAuth configuration object                                                                      | No                       |
| `providers.google.clientId`          | `string`           | Google OAuth client ID from Google Cloud Console                                                       | Required if using Google |
| `providers.google.clientSecret`      | `string`           | Google OAuth client secret from Google Cloud Console                                                   | Required if using Google |

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

## Access the session in your tools

Use the `getBetterAuthSession` function to get the current session in your tools. This function will throw an error if it is used outside of a `betterAuthProvider` middleware, since session will be null.

```ts
import { getBetterAuthSession } from "@xmcp-dev/better-auth";

export default async function getMySession() {
  const session = await getBetterAuthSession();

  return `Your user id is ${session.userId}`;
}
```

The session contains `userId`, `clientId`, `scopes` (space-separated), `accessToken` and `accessTokenExpiresAt`, read from the verified access token.

The login page will be available at `http://host:port/auth/sign-in` and is automatically generated by the config you passed to the provider function. It is also the same page for signing up. After signing in, users approve each MCP client once on `http://host:port/auth/consent`.

MCP clients register themselves through dynamic client registration and must send the `resource` parameter (`<baseURL>/mcp`) when they request a token, as the MCP authorization spec requires. The plugin serves `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server` for discovery.

## Upgrading from `@xmcp-dev/better-auth` 1.0

Version 1.1 runs on Better Auth 1.7, which moves the MCP plugin to `@better-auth/mcp` and replaces the OAuth tables. Before deploying it:

1. Run this script on your database. It drops the 1.6 OAuth tables and creates the 1.7 ones; user, session and account data is kept.

```sql
drop table "oauthAccessToken";
drop table "oauthConsent";
drop table "oauthApplication";

create table "jwks" ("id" text not null primary key, "publicKey" text not null, "privateKey" text not null, "createdAt" timestamptz not null, "expiresAt" timestamptz, "alg" text, "crv" text);

create table "oauthClient" ("id" text not null primary key, "clientId" text not null unique, "clientSecret" text, "clientDiscoveryId" text, "disabled" boolean, "skipConsent" boolean, "enableEndSession" boolean, "subjectType" text, "scopes" jsonb, "clientCredentialsScopes" jsonb, "userId" text references "user" ("id") on delete cascade, "createdAt" timestamptz, "updatedAt" timestamptz, "name" text, "uri" text, "icon" text, "contacts" jsonb, "tos" text, "policy" text, "softwareId" text, "softwareVersion" text, "softwareStatement" text, "redirectUris" jsonb not null, "postLogoutRedirectUris" jsonb, "backchannelLogoutUri" text, "backchannelLogoutSessionRequired" boolean, "tokenEndpointAuthMethod" text, "applicationType" text, "jwks" text, "jwksUri" text, "grantTypes" jsonb, "responseTypes" jsonb, "requirePKCE" boolean, "dpopBoundAccessTokens" boolean, "referenceId" text, "metadata" jsonb);

create table "oauthResource" ("id" text not null primary key, "identifier" text not null unique, "name" text not null, "accessTokenTtl" integer, "refreshTokenTtl" integer, "signingAlgorithm" text, "signingKeyId" text, "allowedScopes" jsonb, "customClaims" jsonb, "dpopBoundAccessTokensRequired" boolean, "disabled" boolean, "createdAt" timestamptz, "updatedAt" timestamptz, "policyVersion" integer, "metadata" jsonb);

create table "oauthClientResource" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "resourceId" text not null references "oauthResource" ("identifier") on delete cascade, "metadata" jsonb, "createdAt" timestamptz);

create table "oauthRefreshToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text not null references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "rotatedAt" timestamptz, "rotationReplayResponse" text, "rotationReplayExpiresAt" timestamptz, "authTime" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "oauthAccessToken" ("id" text not null primary key, "token" text not null unique, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "sessionId" text references "session" ("id") on delete set null, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "authorizationCodeId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "refreshId" text references "oauthRefreshToken" ("id") on delete cascade, "expiresAt" timestamptz not null, "createdAt" timestamptz not null, "revoked" timestamptz, "confirmation" jsonb, "scopes" jsonb not null);

create table "oauthConsent" ("id" text not null primary key, "clientId" text not null references "oauthClient" ("clientId") on delete cascade, "userId" text references "user" ("id") on delete cascade, "referenceId" text, "resources" jsonb, "requestedUserInfoClaims" jsonb, "scopes" jsonb not null, "createdAt" timestamptz not null, "updatedAt" timestamptz not null);

create table "oauthClientAssertion" ("id" text not null primary key, "expiresAt" timestamptz not null);

create index "oauthClient_userId_idx" on "oauthClient" ("userId");
create index "oauthClientResource_clientId_idx" on "oauthClientResource" ("clientId");
create index "oauthClientResource_resourceId_idx" on "oauthClientResource" ("resourceId");
create index "oauthRefreshToken_clientId_idx" on "oauthRefreshToken" ("clientId");
create index "oauthRefreshToken_sessionId_idx" on "oauthRefreshToken" ("sessionId");
create index "oauthRefreshToken_userId_idx" on "oauthRefreshToken" ("userId");
create index "oauthRefreshToken_authorizationCodeId_idx" on "oauthRefreshToken" ("authorizationCodeId");
create index "oauthAccessToken_clientId_idx" on "oauthAccessToken" ("clientId");
create index "oauthAccessToken_sessionId_idx" on "oauthAccessToken" ("sessionId");
create index "oauthAccessToken_userId_idx" on "oauthAccessToken" ("userId");
create index "oauthAccessToken_authorizationCodeId_idx" on "oauthAccessToken" ("authorizationCodeId");
create index "oauthAccessToken_refreshId_idx" on "oauthAccessToken" ("refreshId");
create index "oauthConsent_clientId_idx" on "oauthConsent" ("clientId");
create index "oauthConsent_userId_idx" on "oauthConsent" ("userId");
create unique index "oauthClientResource_clientId_resourceId_uidx" on "oauthClientResource" ("clientId", "resourceId");
```

2. Reconnect your MCP clients. Clients registered with the old plugin and their tokens are removed, so each client registers again and the user approves it on the consent page.
3. If your tools read `session.refreshToken` or `session.refreshTokenExpiresAt` from `getBetterAuthSession()`, remove those reads. The session is now built from the access token and no longer includes them.
