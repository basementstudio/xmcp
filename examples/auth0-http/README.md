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
# Credentials
DOMAIN=your-tenant.auth0.com
AUDIENCE=http://127.0.0.1:3001/
CLIENT_ID=your-m2m-client-id
CLIENT_SECRET=your-m2m-client-secret

# App configuration
BASE_URL=http://127.0.0.1:3001
```

### 3. Run

```bash
pnpm dev
```

## Tools and scopes

- Scope name is inferred from tool metadata: `tool:<metadata.name>`.
- If the scope exists in Auth0, the caller token must include it (via `permissions` or `scope` claims).

## OAuth Metadata

The server exposes:

- `GET /.well-known/oauth-protected-resource` - Resource metadata for MCP clients
