# NestJS Authentication Example

This example demonstrates OAuth 2.0 Bearer token authentication in a NestJS + XMCP application using the `@McpAuth` decorator.

## Features

- **`@McpAuth` Decorator**: Combined decorator that applies authentication guard and configuration
- **Custom Token Verification**: Implement your own `verifyToken` function to integrate with any OAuth provider
- **`@Auth()` Parameter Decorator**: Access authenticated user info in controllers
- **`authInfo` in Tools**: Access authentication information within MCP tools
- **Required Scopes**: Enforce scope requirements at the controller level
- **RFC 9728 Compliance**: Returns proper OAuth error responses

## Project Structure

```
nestjs-auth/
├── src/
│   ├── main.ts                    # Application bootstrap
│   ├── app.module.ts              # Root module with XmcpCoreModule
│   ├── mcp/
│   │   └── mcp.controller.ts      # Controller with @McpAuth decorator
│   └── tools/
│       └── get-profile.ts         # Tool using authInfo
├── package.json
├── tsconfig.json
├── nest-cli.json
├── xmcp.config.ts
└── README.md
```

## Key Concepts

### 1. Controller with `@McpAuth`

```typescript
import { McpAuth, Auth, AuthInfo, XmcpService, VerifyToken } from "@xmcp/adapter";

const verifyToken: VerifyToken = async (req, bearerToken) => {
  // Validate token and return auth info
  return {
    token: bearerToken,
    clientId: "user-123",
    scopes: ["mcp:read", "profile"],
  };
};

@Controller("mcp")
export class McpController {
  constructor(private readonly xmcpService: XmcpService) {}

  @Post()
  @McpAuth({
    verifyToken,
    required: true,
    requiredScopes: ["mcp:read"],
  })
  async handleMcp(
    @Auth() auth: AuthInfo,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    console.log("Client ID:", auth?.clientId);
    return this.xmcpService.handleRequest(req, res);
  }
}
```

### 2. Accessing `authInfo` in Tools

```typescript
import { type ToolExtraArguments } from "xmcp";

export default async function getProfile(
  args: InferSchema<typeof schema>,
  extra: ToolExtraArguments
) {
  const { authInfo } = extra;

  if (!authInfo) {
    return { content: [{ type: "text", text: "Not authenticated" }] };
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        clientId: authInfo.clientId,
        scopes: authInfo.scopes,
      }, null, 2),
    }],
  };
}
```

## Running the Example

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Test with authentication:
   ```bash
   # Create a demo token (base64 encoded JSON)
   TOKEN=$(echo '{"clientId":"user-123","scopes":["mcp:read","profile"]}' | base64)

   # Call the MCP endpoint with the token
   curl -X POST http://localhost:3000/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'
   ```

## Auth Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `verifyToken` | `VerifyToken` | Function to verify Bearer tokens |
| `required` | `boolean` | If true, requests without valid tokens are rejected |
| `requiredScopes` | `string[]` | List of scopes that must be present in the token |

## AuthInfo Interface

```typescript
interface AuthInfo {
  token: string;           // The raw bearer token
  clientId: string;        // Client/user identifier
  scopes: string[];        // Granted scopes
  expiresAt?: number;      // Token expiration (Unix timestamp)
  resource?: URL;          // RFC 8707 resource identifier
  extra?: Record<string, unknown>;  // Additional data
}
```

## Integration with OAuth Providers

For production use, replace the demo `verifyToken` function with your OAuth provider's verification:

- **Auth0**: Use `@auth0/auth0-spa-js` or validate JWTs
- **Clerk**: Use `@clerk/clerk-sdk-node`
- **Firebase**: Use `firebase-admin` to verify ID tokens
- **Custom JWT**: Use `jsonwebtoken` to verify your tokens
