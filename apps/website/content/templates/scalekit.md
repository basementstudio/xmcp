---
name: "Scalekit Authentication"
description: "An MCP server with Scalekit authentication for B2B organizations. Per-user and per-org data isolation with optional RBAC."
category: "authentication"
tags: ["scalekit", "oauth", "b2b", "organizations", "rbac", "http"]
---

# xmcp Scalekit Template

An authenticated MCP server using Scalekit for per-user and per-organization access.

## Features

- Scalekit OAuth 2.1 via the official @xmcp-dev/scalekit plugin
- Per-user and per-organization session via `getSession()`
- RBAC support using permissions from the access token
- Example tools: `whoami`, `save_note`, `list_my_notes` (demonstrating isolation)
- HTTP transport with middleware-based auth
- Works with Cursor, Claude Code, Claude Desktop, and other MCP clients

## Getting Started

### Prerequisites

You need a [Scalekit](https://scalekit.com) account with:

- An MCP server resource registered in the dashboard
- Dynamic Client Registration enabled

### 1. Create the project

```bash
npx create-xmcp-app --example scalekit
```

### 2. Environment setup

```bash
cp .env.example .env
```

Edit `.env` with your Scalekit credentials:

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=skcs_...
SCALEKIT_RESOURCE_ID=res_...
BASE_URL=http://127.0.0.1:3001
```

### 3. Install & run

```bash
pnpm install
pnpm dev
```

## How It Works

1. MCP clients send requests with `Authorization: Bearer <token>` header
2. The middleware verifies the JWT using Scalekit's JWKS
3. Valid sessions (including organization context) are stored in AsyncLocalStorage context
4. Tools access session data via `getSession()`

## Using Session Data in Tools

```typescript
import { getSession } from "@xmcp-dev/scalekit";

export default function myTool() {
  const session = getSession();

  console.log(session.userId);
  console.log(session.organizationId);
  console.log(session.permissions);

  return `Hello from ${session.organizationId || "unknown org"}!`;
}
```

## Demonstrating Per-User and Per-Organization Isolation

This template includes example tools `save_note` and `list_my_notes` that scope data to the authenticated user and organization, with optional RBAC using permissions like `notes:read` and `notes:write`.

For a full test with multiple organizations, see the [Scalekit Integration Guide](https://xmcp.dev/docs/integrations/scalekit).

## RBAC with Permissions (Optional)

Scalekit can include `permissions` in the token. Enforce them in tools:

```typescript
import { getSession } from "@xmcp-dev/scalekit";

export default function saveNote({ content }: { content: string }) {
  const session = getSession();

  if (!session.permissions?.includes("notes:write")) {
    return "Missing notes:write permission.";
  }

  // ... save logic scoped to session.userId and session.organizationId
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
- [Scalekit Integration Guide](https://xmcp.dev/docs/integrations/scalekit)
- [Scalekit MCP Auth Quickstart](https://docs.scalekit.com/authenticate/mcp/quickstart)
