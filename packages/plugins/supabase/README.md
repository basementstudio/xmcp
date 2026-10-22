# @xmcp-dev/supabase

Use existing Supabase Auth access tokens and query your database as the authenticated user. `@xmcp-dev/supabase` verifies every HTTP request and provides an isolated Supabase client for row-level security (RLS).

```sh
pnpm add @xmcp-dev/supabase @supabase/supabase-js
```

```ts
import { supabaseAuth } from "@xmcp-dev/supabase";

export default supabaseAuth({
  url: process.env.SUPABASE_URL!,
  publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
});
```

Use a publishable key or a legacy `anon` key. Secret and `service_role` keys are rejected. Send `Authorization: Bearer <supabase-access-token>` on every request, including initialize and discovery. The plugin checks the token with the configured project's Auth server using [`getUser(token)`](https://supabase.com/docs/reference/javascript/auth-getuser); it never trusts a decoded session alone. Missing or invalid tokens receive HTTP 401 and a Bearer challenge. Authentication failures cannot fall back to anonymous access.

```ts
import { getSupabase } from "@xmcp-dev/supabase";

export default async function myNotes() {
  const { data, error } = await getSupabase()
    .from("notes")
    .select("id, body")
    .limit(20);
  if (error) throw new Error("Unable to read notes");
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}
```

The request client sends the verified user's token for database queries. It disables persistent sessions and token refresh. `getSupabaseUser()` returns the verified user; both helpers throw outside the active request. User data is never recovered from an earlier stateless HTTP request.

Enable RLS and write policies such as `auth.uid() = user_id`. The plugin preserves the user token; it does not create policies or grant table access for you. See [Supabase RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security).

This integration targets the standalone HTTP transport and Express middleware adapters. It does not implement an OAuth authorization server, refresh clients' tokens, or supply HTTP authentication for STDIO or Fetch-only adapters. Configure clients that already have a Supabase access token; use your existing sign-in flow to obtain and renew it.

The [runnable example](https://github.com/basementstudio/xmcp/tree/main/examples/supabase-http) includes a notes table, RLS policy, and instructions for testing two users.
