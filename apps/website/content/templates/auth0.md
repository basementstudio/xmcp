---
name: "Auth0 Authentication"
description: "An MCP server with Auth0 authentication and tools to interact with Auth0 client."
category: "authentication"
tags: ["auth0", "http"]
---

# xmcp Auth0 Template

An authenticated MCP server using Auth0 for JWT-based authentication.

## Features

- Auth0 JWT verification via JWKS endpoint
- Session data accessible in tools via `getAuthInfo()`
- OAuth discovery endpoints auto-registered
- Example tools: `greet`, `random-number`, `whoami`
- HTTP transport with middleware-based auth

## Getting Started

### Prerequisites

You need an [Auth0](https://auth0.com) account with:

- An API (or create one)
- A Machine-to-Machine application with access to your API

### 1. Create the project

```bash
npx create-xmcp-app --example auth0
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your Auth0 credentials:

```bash
DOMAIN=your-tenant.auth0.com
AUDIENCE=http://127.0.0.1:3001/
CLIENT_ID=your-m2m-client-id
CLIENT_SECRET=your-m2m-client-secret
BASE_URL=http://127.0.0.1:3001
```

### 3. Install & run

```bash
pnpm install
pnpm dev
```

## How It Works

1. MCP clients send requests with `Authorization: Bearer <token>` header
2. The middleware verifies the JWT using Auth0's JWKS endpoint
3. Valid sessions are stored in AsyncLocalStorage context
4. Tools access auth data via `getAuthInfo()`

## Using Auth Data in Tools

```typescript
import { getAuthInfo } from "@xmcp-dev/auth0";

export default function myTool() {
  const authInfo = getAuthInfo();

  console.log(authInfo.user.sub); // User ID
  console.log(authInfo.user.email); // User email
  console.log(authInfo.user.name); // User name
  console.log(authInfo.clientId); // Client ID
  console.log(authInfo.scopes); // Token scopes
  console.log(authInfo.expiresAt); // Token expiration

  return `Hello ${authInfo.user.name}!`;
}
```

## OAuth Endpoints

The plugin automatically registers:

- `GET /.well-known/oauth-protected-resource` — Resource server metadata
- `GET /.well-known/oauth-authorization-server` — Authorization server metadata

## Deploy

```bash
pnpm build
node dist/http.js
```

## Learn More

- [xmcp Documentation](https://xmcp.dev/docs)
- [Auth0 Integration Guide](https://xmcp.dev/docs/integrations/auth0)
- [Auth0 Dashboard](https://manage.auth0.com)
