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
   npx @better-auth/cli generate
   ```

   This will output a file with the database schema, which you can then use to create your database tables. <- this has to be done manually or with an ORM.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

## How It Works

The MCP server is protected with Better Auth authentication. The key integration is in `src/app/mcp/route.ts`:

```typescript
import { withMcpAuth } from "better-auth/plugins";

const handler = withMcpAuth(auth, (req) => {
  return xmcpHandler(req);
});
```

This ensures all MCP requests are authenticated before being processed.

## Authentication Flow

1. Connecting from a client to the MCP server will trigger the authentication flow.
2. Users visit `/login` to authenticate
3. Better Auth handles OAuth and email/password authentication
4. You can now access the MCP server tools

## Project Structure

- `src/app/mcp/route.ts` - Protected MCP endpoint
- `src/app/login/page.tsx` - Login page
- `src/app/api/auth/[...all]/route.ts` - Auth API routes
- `src/lib/auth.ts` - Better Auth configuration (database, plugins, etc.)
- `src/lib/auth-client.ts` - Better Auth client (for the login page)
- `src/app/.well-known/oauth-authorization-server/route.ts` - OAuth Authorization Server
- `src/tools/` - Your MCP tools (example: `greet.ts`)

## Learn More

- [Better Auth Documentation](https://www.better-auth.com/docs/installation)
- [xmcp Documentation](https://xmcp.dev)
