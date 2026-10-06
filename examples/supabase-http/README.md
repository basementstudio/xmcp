# Supabase example

Apply `schema.sql` to your Supabase project, create two Auth users, and seed notes with each user ID. Set the project URL and publishable key. Obtain user access tokens through your existing sign-in flow and send one in the Authorization Bearer header on **every** MCP request. `my-notes` should return only the current user’s rows. Repeat with the other user and verify a missing/expired token returns HTTP 401.

From the repository root:

```sh
pnpm install
pnpm exec turbo run build --filter=xmcp --filter=@xmcp-dev/compiler --filter=@xmcp-dev/supabase
pnpm install --frozen-lockfile
cp examples/supabase-http/.env.example examples/supabase-http/.env
# Fill in .env before starting.
pnpm --filter supabase-http build
pnpm --filter supabase-http start
```

The MCP endpoint is `http://localhost:3001/mcp`.

Builds and automated tests do not require hosted credentials. Tests use local transports or fakes; live provider validation requires your own configured account.
