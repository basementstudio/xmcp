# Native OAuth HTTP Example

This example demonstrates xmcp native OAuth on the core HTTP transport with the stable `oauth` config, built-in bearer-token middleware, and a real local OAuth provider.

## What it shows

- top-level `oauth` serving resource metadata and authorization-server metadata
- issuer discovery resolving authorization, token, registration, revocation, introspection, and JWKS metadata from the local provider
- a real local OAuth provider process with authorization code + PKCE, token, JWKS, introspection, revoke, and dynamic client registration
- built-in native OAuth middleware validating JWT access tokens through the discovered JWKS endpoint
- a consent form where you can change the user identity before issuing the token
- resource/audience values flowing from the xmcp OAuth proxy to the provider without hardcoded example-only workarounds
- a `whoami` tool that reads the normalized auth context through `xmcp/auth`

## Run it

```bash
pnpm --dir examples/auth-native-oauth dev
```

The MCP server runs on `http://127.0.0.1:3004`.

The embedded OAuth provider runs on `http://127.0.0.1:4404`.

## Important endpoints

- `GET http://127.0.0.1:3004/.well-known/oauth-protected-resource`
- `GET http://127.0.0.1:3004/.well-known/oauth-protected-resource/mcp`
- `GET http://127.0.0.1:3004/.well-known/oauth-authorization-server`
- `GET http://127.0.0.1:3004/oauth2/authorize`
- `POST http://127.0.0.1:3004/oauth2/token`
- `POST http://127.0.0.1:3004/oauth2/register`
- `POST http://127.0.0.1:3004/oauth2/introspect`
- `GET http://127.0.0.1:4404/.well-known/jwks.json`
- `POST http://127.0.0.1:3004/mcp`

## Demo OAuth client

- `client_id`: `demo-client`
- `client_secret`: `demo-secret`
- `redirect_uri`: `http://127.0.0.1:4404/debug/callback`
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
http://127.0.0.1:3004/oauth2/authorize?response_type=code&client_id=demo-client&redirect_uri=http%3A%2F%2F127.0.0.1%3A4404%2Fdebug%2Fcallback&scope=openid%20profile%20email%20tool%3Awhoami&state=demo-state&code_challenge=cH-Nh-yHrZB6h8h84K9JxwL6jC7xXjmVLRghKhPYMr0&code_challenge_method=S256&resource=http%3A%2F%2F127.0.0.1%3A3004%2Fmcp
```

2. Approve the consent page.
   You can change the user ID, name, email, and organization before submitting.
3. Copy the `code` value shown on the `/debug/callback` page.
4. Exchange that code for tokens:

```bash
curl -X POST http://127.0.0.1:3004/oauth2/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "client_id=demo-client" \
  -d "client_secret=demo-secret" \
  -d "redirect_uri=http://127.0.0.1:4404/debug/callback" \
  -d "code=PASTE_CODE_HERE" \
  -d "code_verifier=demo-verifier-with-sufficient-length-1234567890" \
  -d "resource=http://127.0.0.1:3004/mcp"
```

The returned `access_token` is a signed JWT. The MCP server validates it through the provider JWKS endpoint discovered from the issuer metadata.

Clients may probe `http://127.0.0.1:3004/mcp` directly during OAuth bootstrap. xmcp responds with a bearer challenge that points at endpoint-scoped protected-resource metadata for `/mcp`.

The profile values you entered on the consent page are embedded in that token and will show up in the `whoami` tool response.

## Example MCP client config

```json
{
  "mcpServers": {
    "native-oauth-http": {
      "url": "http://127.0.0.1:3004/mcp",
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
    "scope": "openid profile email tool:whoami",
    "client_id": "demo-client",
    "sub": "demo-user-123",
    "email": "demo@example.com",
    "name": "Demo User"
  }
}
```

`expiresAt` will reflect the access token expiration time issued by the provider.
