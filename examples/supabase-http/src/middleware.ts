import { supabaseAuth } from "@xmcp-dev/supabase";
import type { Middleware } from "xmcp";
let auth: Middleware | undefined;
const middleware: Middleware = (request, response, next) => {
  auth ??= supabaseAuth({
    url: process.env.SUPABASE_URL!,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY!,
  });
  return (auth as Exclude<Middleware, { router: unknown }>)(
    request,
    response,
    next
  );
};
export default middleware;
