# Auth0 HTTP Example

This example demonstrates how to create an authenticated MCP server using Auth0 with xmcp.

## Setup

### 1. Auth0 Configuration

1. Go to your [Auth0 Dashboard](https://manage.auth0.com)
2. Create an API under **Applications** → **APIs**
3. Note the **API Identifier** (this is your `audience`)
4. Define scopes: `tool:greet`, `tool:whoami`

### 2. Environment Variables

Create a `.env` file:

```bash
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_AUDIENCE=http://localhost:3001/
BASE_URL=http://localhost:3001
```

### 3. Run

```bash
pnpm dev
```

## Features

- **Scope-based Authorization**: Each tool can require specific scopes
- **`requireScopes` HOF**: Wrap tools with scope validation
- **Auth Info Access**: Get user identity in tool handlers

## Tools

- `greet` - Greets the user (requires `tool:greet` scope)
- `whoami` - Returns user info (requires `tool:whoami` scope)

## OAuth Metadata

The server exposes:

- `GET /.well-known/oauth-protected-resource` - Resource metadata for MCP clients
