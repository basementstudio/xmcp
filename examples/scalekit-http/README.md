# Scalekit HTTP Example

This example demonstrates how to create an authenticated MCP server using Scalekit with xmcp.

## Setup

### 1. Scalekit Dashboard Setup

1. Go to your [Scalekit Dashboard](https://app.scalekit.com).
2. Navigate to **MCP Auth** and register a new MCP server resource.
3. Save your environment URL, client ID, and client secret.
4. Scalekit automatically enables Dynamic Client Registration (DCR) and Client ID Metadata Documents (CIMD) for MCP clients.

### 2. Environment Variables

Create a `.env` file:

```bash
SCALEKIT_ENVIRONMENT_URL=https://your-env.scalekit.com
SCALEKIT_CLIENT_ID=skc_...
SCALEKIT_CLIENT_SECRET=skcs_...

BASE_URL=http://127.0.0.1:3001
```

### 3. Run

```bash
pnpm dev
```

## Tools

- `whoami` — Returns the authenticated user's session information
- `greet` — Greets the user with their Scalekit identity
- `random-number` — Generates a random number (no auth required for tool logic)

## OAuth Metadata

The server exposes:

- `GET /.well-known/oauth-protected-resource` — Resource metadata for MCP clients
- `GET /.well-known/oauth-authorization-server` — Proxied authorization server metadata from Scalekit