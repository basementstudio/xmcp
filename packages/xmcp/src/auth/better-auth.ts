import { BetterAuthConfig } from "@/compiler/config/types";
import { betterAuth } from "better-auth";
import { mcp } from "better-auth/plugins";
import { Pool } from "pg";

// email and password only temp

export function betterAuthProvider(config: BetterAuthConfig | undefined) {
  if (!config) {
    return undefined;
  }

  // validate db
  // allow all connection types
  const pool = new Pool({
    connectionString: config.database.connectionString,
  });

  return betterAuth({
    // to do check database throwing any
    database: pool,
    baseURL: config.baseURL,
    secret: config.secret,
    emailAndPassword: {
      enabled: config.emailAndPassword.enabled,
    },
    plugins: [mcp({ loginPage: config.loginPage })],
  });
}

export type BetterAuthInstance = ReturnType<typeof betterAuth>;

/*
// TEMP

export const config: BetterAuthConfig = {
  database: new Pool({
    connectionString: DATABASE_URL,
  }),
  baseURL: "http://127.0.0.1:3002",
  secret: SECRET,
  emailAndPassword: {
    enabled: true,
  },
  loginPage: "/login",
};

export function betterAuthMiddleware(
  betterAuth: BetterAuthConfig
): RequestHandler | null {
  if (!betterAuth) {
    return null;
  }

  // setup discovery route
  this.app.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const config = await (this.betterAuth as any).api.getMcpOAuthConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get OAuth config" });
    }
  });

  this.app.all("/api/auth/*", toNodeHandler(this.betterAuth as any));

  // return the authentication middleware
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply auth middleware to the MCP endpoint
    if (req.path !== this.endpoint) {
      return next();
    }

    try {
      const config = await (this.betterAuth as any).api.getMcpOAuthConfig();

      // get session
      const session = await (this.betterAuth as any).api.getMcpSession({
        headers: req.headers as unknown as HeadersInit,
      });

      if (!session || !session.user) {
        // return oauth authorization server config
        res.status(401).json(config);
        return;
      }

      // session is valid, proceed to next middleware
      next();
    } catch (error) {
      console.error("[better auth] Authentication check failed:", error);
      // on auth error, return authorization server config
      try {
        const config = await (this.betterAuth as any).api.getMcpOAuthConfig();
        res.status(401).json(config);
      } catch (configError) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Authentication required but OAuth config unavailable",
          },
          id: null,
        });
      }
    }
  };
}
 */
