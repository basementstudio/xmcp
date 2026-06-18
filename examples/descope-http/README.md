# Descope HTTP Example

This example demonstrates how to create an authenticated MCP server using Descope with xmcp.

## Setup

### 1. Descope Setup

#### Step 1: Create an MCP Server Resource

1. Go to **Descope Console** → **Agentic Identity Hub** → **Resources**
2. Click **Create Resource** → **MCP Server**
3. Set a name and your server's base URL (e.g., `http://localhost:3001`)
4. Copy the **Issuer URL**

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:

```bash
DESCOPE_ISSUER_URL=https://api.descope.com/your-project-id/your-audience
BASE_URL=http://127.0.0.1:3001
```

### 3. Run

```bash
pnpm dev
```

The MCP server starts at `http://127.0.0.1:3001/mcp`.

## Testing

Send a `tools/call` request with a valid Descope session token. Follow the [Descope OIDC Endpoints Quickstart](https://docs.descope.com/getting-started/oidc-endpoints) to learn how to get one. Then edit and make the following POST request:

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Authorization: Bearer <your-descope-token>" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  --data-raw '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"whoami","arguments":{}}}'
```

## OAuth Metadata

The server exposes:

- `GET /.well-known/oauth-protected-resource` — Resource metadata for MCP clients
- `GET /.well-known/oauth-authorization-server` — Descope OIDC discovery document
