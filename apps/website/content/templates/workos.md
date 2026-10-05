---
name: "WorkOS AuthKit"
description: "An MCP server with WorkOS AuthKit authentication"
category: "authentication"
tags: ["workos", "http"]
---

# xmcp WorkOS Template

An authenticated MCP server using WorkOS AuthKit for JWT-based authentication.

## Features

- WorkOS AuthKit JWT verification via JWKS endpoint
- Session data via `getSession()`, full user data via `getUser()`
- OAuth discovery endpoints auto-registered
- Example tools: `greet`, `whoami`
- HTTP transport with middleware-based auth

## Getting Started

### Prerequisites

You need a [WorkOS](https://workos.com) account with:

- MCP Auth enabled under **Connect** → **Configuration**
- **Client ID Metadata Document (CIMD)** enabled for MCP client authentication

### 1. Create the project

```bash
npx create-xmcp-app --example workos
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your WorkOS credentials:

```bash
WORKOS_API_KEY=sk_test_...
WORKOS_CLIENT_ID=client_...
WORKOS_AUTHKIT_DOMAIN=yourcompany.authkit.app
BASE_URL=http://127.0.0.1:3001
```

### 3. Install & run

```bash
pnpm install
pnpm dev
```

## How It Works

1. MCP clients send requests with `Authorization: Bearer <token>` header
2. The middleware verifies the JWT using WorkOS AuthKit's JWKS endpoint
3. Valid sessions are stored in AsyncLocalStorage context
4. Tools access session data via `getSession()` and `getUser()`

## Using Session Data in Tools

```typescript
import { getSession, getUser } from "@xmcp-dev/workos";

export default async function myTool() {
  // Get session data from JWT (fast, no API call)
  const session = getSession();
  console.log(session.userId);
  console.log(session.organizationId);

  // Get full user data from WorkOS API
  const user = await getUser();
  console.log(user.email);
  console.log(user.firstName);

  return `Hello ${user.firstName}!`;
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
- [WorkOS Integration Guide](https://xmcp.dev/docs/integrations/workos)
- [WorkOS Dashboard](https://dashboard.workos.com)
