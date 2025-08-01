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

1. Create a `.env` file in your xmcp app root directory and add the following environment variables:

```
DATABASE_URL=postgresql://<username>:<password>@<host>:<port>/<database>

BETTER_AUTH_SECRET=<secret>
BETTER_AUTH_BASE_URL=<base-url>
```

4. Create a middleware.ts file in your xmcp app root directory and import the `betterAuthProvider`

To this provider you need to pass an auth config object of the following shape:

```tsx
type BetterAuthConfig = {
  database: Database;
  baseURL: string;
  secret: string;
  providers?: {
    emailAndPassword?: boolean;
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
};
```

You can also access the exported type from the plugin:

```ts
import { BetterAuthConfig } from "@xmcp-dev/better-auth";
```

This config object is used to configure the Better Auth instance through the provider function.

`database`: type exported from `pg`. Must be a valid instance of `Pool`.

`baseURL`: the base URL of your xmcp app. This is used to generate the OAuth callback URL. This variable should be the same as the host/port of your xmcp app.

`secret`: the secret used to sign the JWT tokens. You can generate a random secret here

`providers`: an object with the providers you want to enable. Currently, only `emailAndPassword` and `google` are supported.

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

5. In a `middleware.ts` file in the root of your xmcp app, import the `betterAuthProvider` and pass the config object to it.

```ts
import { betterAuthProvider } from "@xmcp-dev/better-auth";

const config: BetterAuthConfig = {
  // your config
};

export const middleware = betterAuthProvider(config);
```

You can also use the `getBetterAuthSession` function to get the current session in your tools. This function will throw an error if it is used outside of a `betterAuthProvider` middleware, since session will be null.

```ts
import { getBetterAuthSession } from "@xmcp-dev/better-auth";

export default async function session() {
  const session = getBetterAuthSession();

  const result = `Your user id is ${session.userId}`;

  return {
    content: [{ type: "text", text: result }],
  };
}
```

The login page will be available at `http://host:port/auth/sign-in` and is automatically generated by the config you passed to the provider function. It is also the same page for signing up.
