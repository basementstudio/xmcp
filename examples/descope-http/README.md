# Descope HTTP Example

This example demonstrates how to create an authenticated MCP server using Descope with xmcp.

## Setup

### 1. Descope Setup

#### Step 1: Create a Project

Create a project at [app.descope.com](https://app.descope.com) and copy the **Project ID** from project settings.

#### Step 2: Create an Agentic MCP Server

1. Go to **Descope Console** → **Agentic Identity Hub** → **MCP Servers**
2. Click **Create MCP Server**
3. Set a name and your server's base URL (e.g., `http://localhost:3001`)
4. Copy the **MCP Server ID**

### 2. Environment Variables

```bash
cp .env.example .env
```

Fill in `.env`:

```bash
DESCOPE_PROJECT_ID=your-descope-project-id
DESCOPE_MCP_SERVER_ID=your-mcp-server-id
BASE_URL=http://127.0.0.1:3001
```

To use `getUser()`, also add:

```bash
DESCOPE_MANAGEMENT_KEY=your-management-key
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
