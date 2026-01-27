# Cloudflare Workers + WorkOS OAuth Example

This example demonstrates how to deploy an MCP server on Cloudflare Workers with WorkOS OAuth authentication.

## Features

- JWT token verification using WorkOS as the OAuth provider
- RFC 9728 OAuth Protected Resource Metadata endpoint
- Scope-based access control
- Tools that access authenticated user info

## Prerequisites

1. A [WorkOS](https://workos.com/) account
2. A [Cloudflare](https://cloudflare.com/) account
3. Node.js 18+ and pnpm

## WorkOS Setup

### 1. Create a WorkOS Application

1. Go to [WorkOS Dashboard](https://dashboard.workos.com/)
2. Navigate to **Configuration** > **API Keys**
3. Note your **Client ID** (starts with `client_`)

### 2. Configure SSO or AuthKit

WorkOS offers multiple authentication methods:

- **AuthKit**: Hosted authentication UI (easiest)
- **SSO**: Enterprise Single Sign-On
- **Magic Link**: Passwordless email authentication

For this example, we'll use AuthKit:

1. Go to **Authentication** > **AuthKit**
2. Configure your redirect URIs
3. Note the **Issuer URL**: `https://api.workos.com/`

### 3. Get Your JWKS URI

WorkOS uses a standard JWKS endpoint:
```
https://api.workos.com/.well-known/jwks.json
```

## Deployment

### 1. Install Dependencies

```bash
cd examples/cloudflare-workers-workos
pnpm install
```

### 2. Build for Cloudflare

```bash
pnpm build
```

### 3. Configure Secrets

Set your WorkOS OAuth configuration as Cloudflare secrets:

```bash
cd .cloudflare

# Set the OAuth issuer (WorkOS API endpoint)
npx wrangler secret put MCP_OAUTH_ISSUER
# Enter: https://api.workos.com/

# Set the audience (your WorkOS Client ID)
npx wrangler secret put MCP_OAUTH_AUDIENCE
# Enter: client_XXXXXXXXXXXXXXXXXX

# Set the authorization servers
npx wrangler secret put MCP_OAUTH_AUTHORIZATION_SERVERS
# Enter: https://api.workos.com
```

### 4. Deploy

```bash
npx wrangler deploy
```

## Testing Locally

### 1. Start the Worker

```bash
cd .cloudflare
npx wrangler dev
```

### 2. Check Health

```bash
curl http://localhost:8787/health
```

### 3. Check OAuth Metadata

```bash
curl http://localhost:8787/.well-known/oauth-protected-resource
```

### 4. Get an Access Token from WorkOS

Using the WorkOS SDK or API, authenticate a user and get an access token:

```javascript
// Example using WorkOS Node SDK
import { WorkOS } from '@workos-inc/node';

const workos = new WorkOS(process.env.WORKOS_API_KEY);

// Get authorization URL
const authorizationUrl = workos.userManagement.getAuthorizationUrl({
  provider: 'authkit',
  redirectUri: 'https://your-app.com/callback',
  clientId: 'client_XXXXXXXXXX',
});

// After user authenticates, exchange code for token
const { accessToken } = await workos.userManagement.authenticateWithCode({
  code: 'authorization_code_from_callback',
  clientId: 'client_XXXXXXXXXX',
});
```

### 5. Call MCP Endpoint with Token

```bash
# List available tools
curl -X POST http://localhost:8787/mcp \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# Call whoami tool
curl -X POST http://localhost:8787/mcp \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"whoami","arguments":{}},"id":2}'
```

## Available Tools

| Tool | Description | Auth Required |
|------|-------------|---------------|
| `hello` | Simple greeting | No |
| `whoami` | Returns authenticated user info | Yes (any token) |
| `get_user_data` | Fetches user data | Yes (requires scope) |

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MCP_OAUTH_ISSUER` | WorkOS API endpoint (`https://api.workos.com/`) | Yes |
| `MCP_OAUTH_AUDIENCE` | Your WorkOS Client ID | Yes |
| `MCP_OAUTH_AUTHORIZATION_SERVERS` | Authorization server URLs | Yes |
| `MCP_OAUTH_REQUIRED_SCOPES` | Comma-separated required scopes | No |
| `MCP_OAUTH_JWKS_URI` | Custom JWKS URI | No |

## Alternative: JSON Config

Instead of individual environment variables, you can use a single JSON config:

```bash
npx wrangler secret put MCP_OAUTH_CONFIG
# Enter:
# {"issuer":"https://api.workos.com/","audience":"client_XXX","authorizationServers":["https://api.workos.com"]}
```

## Troubleshooting

### "Missing Bearer token"

The request doesn't include an `Authorization: Bearer <token>` header.

### "Token has expired"

The JWT has expired. Get a new token from WorkOS.

### "Invalid token signature"

The token wasn't signed by WorkOS, or the JWKS couldn't be fetched.

### "Invalid issuer" or "Invalid audience"

The token's `iss` or `aud` claims don't match your configuration.

## Security Notes

1. **Never commit secrets** - Use `wrangler secret put` for all sensitive values
2. **Use HTTPS** - Cloudflare Workers always serve over HTTPS
3. **Validate scopes** - Check `authInfo.scopes` in your tools for fine-grained access control
4. **Token expiration** - Tokens are validated for expiration automatically

## Learn More

- [WorkOS Documentation](https://workos.com/docs)
- [WorkOS AuthKit](https://workos.com/docs/user-management/authkit)
- [RFC 9728 - OAuth Protected Resource Metadata](https://datatracker.ietf.org/doc/html/rfc9728)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
