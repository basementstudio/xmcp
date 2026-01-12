# Auth0 HTTP Example

This example demonstrates how to create an authenticated MCP server using Auth0 with xmcp.

## Setup

### 1. Auth0 Tenant Setup

MCP clients use Dynamic Client Registration (DCR) and the OAuth 2.0 Resource Parameter. Your Auth0 tenant requires specific configuration.

#### Step 1: Enable Dynamic Client Registration

1. Go to **Auth0 Dashboard** → **Settings** → **Advanced**
2. Enable **"OIDC Dynamic Application Registration"**
3. Save changes

#### Step 2: Enable Resource Parameter Compatibility Profile

1. Go to **Auth0 Dashboard** → **Settings** → **Advanced**
2. Enable **"Resource Parameter Compatibility Profile"**
3. Save changes

#### Step 3: Promote Connection to Domain Level

1. Go to **Auth0 Dashboard** → **Authentication** → **Database**
2. Select your connection (e.g., `Username-Password-Authentication`)
3. Enable **"Enable for third-party clients"**
4. Save changes

#### Step 4: Create the API

**Important**: The API identifier must match your `BASE_URL` with trailing slash.

1. Go to **Auth0 Dashboard** → **Applications** → **APIs**
2. Click **Create API**
3. Set:
   - **Name**: `MCP Server API`
   - **Identifier**: `http://localhost:3001/` (with trailing slash)
4. Go to **Permissions** tab and add:
   - `tool:greet`
   - `tool:whoami`

#### Step 5: Set Default Audience

1. Go to **Auth0 Dashboard** → **Settings** → **General**
2. Set **Default Audience** to `http://localhost:3001/`
3. Save changes

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

## Tools and scopes

Tool scopes are inferred from file names (`tool:<fileName>`). Keep your Auth0 permissions aligned with the tool files:

- `greet` (`src/tools/greet.ts`) → scope `tool:greet`
- `whoami` (`src/tools/whoami.ts`) → scope `tool:whoami`

If you need a different scope name than the file, pass it explicitly to `requireScopes(["tool:custom"], handler)` and add that scope in Auth0.

## OAuth Metadata

The server exposes:

- `GET /.well-known/oauth-protected-resource` - Resource metadata for MCP clients
