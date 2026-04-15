# Native OAuth Custom Middleware Example

This example demonstrates xmcp native OAuth routes mounted from `src/middleware.ts` with `middleware: false`, custom JWT middleware, and a real local OAuth provider.

## What it shows

- xmcp still serves native OAuth metadata and proxy routes through `nativeOAuthMiddleware(...)`
- a real local OAuth provider process handles authorization code + PKCE, token, JWKS, introspection, revoke, and dynamic client registration
- bearer-token verification happens entirely in `src/middleware.ts` through the provider JWKS endpoint
- a consent form where you can change the user identity before issuing the token
- resource/audience values are preserved through the OAuth proxy so JWT verification stays aligned with the MCP resource server
- custom middleware attaches normalized auth to `req.auth`
- the `whoami` tool reads that auth through `xmcp/auth`

## Run it

```bash
pnpm --dir examples/auth-native-oauth-custom-middleware dev
```

The MCP server runs on `http://127.0.0.1:3005`.

The embedded OAuth provider runs on `http://127.0.0.1:4405`.

OAuth is mounted from [src/middleware.ts](/Users/0xkoller/xmcp/xmcp/examples/auth-native-oauth-custom-middleware/src/middleware.ts), not from `xmcp.config.ts`.

## Important endpoints

- `GET http://127.0.0.1:3005/.well-known/oauth-protected-resource`
- `GET http://127.0.0.1:3005/.well-known/oauth-protected-resource/mcp`
- `GET http://127.0.0.1:3005/.well-known/oauth-authorization-server`
- `GET http://127.0.0.1:3005/oauth2/authorize`
- `POST http://127.0.0.1:3005/oauth2/token`
- `GET http://127.0.0.1:4405/.well-known/jwks.json`
- `POST http://127.0.0.1:3005/mcp`

## Demo OAuth client

- `client_id`: `demo-client`
- `client_secret`: `demo-secret`
- `redirect_uri`: `http://127.0.0.1:4405/debug/callback`
- `demo user`: `demo@example.com`

Use this static PKCE verifier for the manual flow:

```text
demo-verifier-with-sufficient-length-1234567890
```

Its SHA-256 base64url challenge is:

```text
cH-Nh-yHrZB6h8h84K9JxwL6jC7xXjmVLRghKhPYMr0
```

## Manual authorization code flow

1. Open this URL in your browser:

```text
http://127.0.0.1:3005/oauth2/authorize?response_type=code&client_id=demo-client&redirect_uri=http%3A%2F%2F127.0.0.1%3A4405%2Fdebug%2Fcallback&scope=openid%20profile%20email%20tool%3Awhoami&state=demo-state&code_challenge=cH-Nh-yHrZB6h8h84K9JxwL6jC7xXjmVLRghKhPYMr0&code_challenge_method=S256&resource=http%3A%2F%2F127.0.0.1%3A3005%2Fmcp
```

2. Approve the consent page.
   You can change the user ID, name, email, and organization before submitting.
3. Copy the `code` value shown on the `/debug/callback` page.
4. Exchange that code for tokens:

```bash
curl -X POST http://127.0.0.1:3005/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "redirect_uri=http://127.0.0.1:4405/debug/callback" \
  -d "code=PASTE_CODE_HERE" \
  -d "code_verifier=demo-verifier-with-sufficient-length-1234567890" \
  -d "resource=http://127.0.0.1:3005/mcp"
```

Unlike the built-in example, the resulting access token is not accepted by xmcp directly. `src/middleware.ts` verifies the JWT against the provider JWKS, maps the claims to `req.auth`, and then tools read it through `xmcp/auth`.

That verification stays stateless as well. xmcp does not persist exchanged tokens between requests.

Clients may also probe `http://127.0.0.1:3005/mcp` directly during OAuth bootstrap. xmcp responds with a bearer challenge that points at endpoint-scoped protected-resource metadata for `/mcp`.

The profile values you entered on the consent page are embedded in the JWT and show up in the `whoami` tool response.

## Example MCP client config

```json
{
  "mcpServers": {
    "native-oauth-custom-middleware": {
      "url": "http://127.0.0.1:3005/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_ACCESS_TOKEN"
      }
    }
  }
}
```

## Expected `whoami` output

```json
{
  "authenticated": true,
  "clientId": "demo-client",
  "scopes": ["openid", "profile", "email", "tool:whoami"],
  "expiresAt": 1760000000,
  "extra": {
    "source": "custom-middleware",
    "userId": "demo-user-456"
  }
}
```

`expiresAt` will reflect the access token expiration time returned by the provider.
