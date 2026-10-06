import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import xmcp, { type Middleware } from "xmcp";
const { createContext } = xmcp;

const session = createContext<{ client: SupabaseClient; user: User }>({
  name: "supabase-request",
  fallback: false,
});
export interface SupabaseAuthOptions {
  url: string;
  /** A publishable key or legacy anon key, never a secret/service-role key. */
  publishableKey: string;
}
export function getSupabase(): SupabaseClient {
  return session.getContext().client;
}
export function getSupabaseUser(): User {
  return session.getContext().user;
}

function isPublicKey(key: string): boolean {
  if (typeof key !== "string") return false;
  if (key.startsWith("sb_publishable_")) return true;
  try {
    return (
      JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString())
        .role === "anon"
    );
  } catch {
    return false;
  }
}

/** Verify each HTTP request and run downstream tools with its user's RLS client. */
export function supabaseAuth(options: SupabaseAuthOptions): Middleware {
  if (!isPublicKey(options.publishableKey))
    throw new Error("Supabase requires a publishable or legacy anon key.");
  const auth = {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  };
  const verifier = createClient(options.url, options.publishableKey, { auth });
  return async (request, response, next) => {
    const authorization = request.headers.authorization;
    const token =
      typeof authorization === "string"
        ? /^Bearer ([^\s]+)$/i.exec(authorization)?.[1]
        : undefined;
    const deny = () => {
      response.setHeader("WWW-Authenticate", 'Bearer realm="xmcp"');
      response.status(401).json({ error: "Invalid or missing access token" });
    };
    if (!token) {
      deny();
      return;
    }
    let user: User;
    try {
      // getUser checks the supplied token with this project's Auth server;
      // getSession alone would only decode untrusted request data.
      const result = await verifier.auth.getUser(token);
      if (result.error || !result.data.user) {
        deny();
        return;
      }
      user = result.data.user;
    } catch {
      response
        .status(503)
        .json({ error: "Authentication service unavailable" });
      return;
    }
    const client = createClient(options.url, options.publishableKey, {
      auth,
      // This immutable per-request token is used for every PostgREST query.
      accessToken: async () => token,
    });
    return session.provider({ client, user }, () => next());
  };
}
