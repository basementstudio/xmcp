# xmcp <> Better Auth Example

This example demonstrates how to integrate Better Auth with xmcp in a Next.js application, using PostgreSQL as the database.

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file with:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/your_database
   ```

   (or the connection options for your database of choice)

3. **Set up the database:**

   ```bash
   npx auth migrate
   ```

   This creates the Better Auth tables, including the JWT and MCP tables, in your database.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## How It Works

The MCP server is protected with the Better Auth [MCP plugin](https://www.better-auth.com/docs/plugins/mcp). The key integration is in `src/app/mcp/route.ts`:

```typescript
import { requireMcpAuth } from "@better-auth/mcp";

const handler = requireMcpAuth(auth, (request) => xmcpHandler(request), {
  resource: mcpResource,
});
```

This ensures all MCP requests are authenticated before being processed.

## Authentication Flow

1. Connecting from a client to the MCP server will trigger the authentication flow.
2. Users visit `/login` to authenticate
3. Users approve the MCP client on `/consent`
4. You can now access the MCP server tools

## Project Structure

- `src/app/mcp/route.ts` - Protected MCP endpoint
- `src/app/login/page.tsx` - Login page
- `src/app/consent/page.tsx` - Consent page
- `src/app/api/auth/[...all]/route.ts` - Auth API routes
- `src/lib/auth.ts` - Better Auth configuration (database, plugins, etc.)
- `src/lib/auth-client.ts` - Better Auth client (for the login page)
- `src/app/.well-known/oauth-authorization-server/[[...issuer]]/route.ts` - OAuth Authorization Server metadata
- `src/app/.well-known/oauth-protected-resource/[[...resource]]/route.ts` - OAuth Protected Resource metadata
- `src/tools/` - Your MCP tools (example: `greet.ts`)

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/docs/installation)
- [xmcp Documentation](https://xmcp.dev)
