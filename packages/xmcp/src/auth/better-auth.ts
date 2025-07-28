import { toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import {
  NextFunction,
  Router,
  type RequestHandler,
  Request,
  Response,
} from "express";
import { Pool } from "pg";
import { mcp } from "better-auth/plugins";
import { XmcpMiddleware } from ".";

type BetterAuthConfig = {
  database: Pool;
  baseURL: string;
  secret: string;
  emailAndPassword: {
    enabled: boolean;
  };
  loginPage: string;
};

type BetterAuthInstance = ReturnType<typeof betterAuth>;

export function betterAuthProvider(auth: BetterAuthConfig): XmcpMiddleware {
  const betterAuthInstance = betterAuth({
    database: auth.database,
    baseURL: auth.baseURL,
    secret: auth.secret,
    emailAndPassword: {
      enabled: auth.emailAndPassword.enabled,
    },
    plugins: [mcp({ loginPage: auth.loginPage })],
  });

  return {
    middleware: betterAuthMiddleware(betterAuthInstance),
    router: betterAuthRouter(betterAuthInstance),
  };
}

export function betterAuthRouter(
  betterAuthInstance: BetterAuthInstance
): Router {
  const router = Router();

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const config = await (betterAuthInstance as any).api.getMcpOAuthConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get OAuth config" });
    }
  });

  router.all("/api/auth/*", toNodeHandler(betterAuthInstance));

  return router;
}

export function betterAuthMiddleware(
  betterAuthInstance: BetterAuthInstance
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    // TO DO:
    // this should actually be reading from the endpoint config
    // harcoded temp
    if (!req.path.startsWith("/mcp")) {
      next();
      return;
    }

    try {
      const config = await (betterAuthInstance as any).api.getMcpOAuthConfig();

      // get session
      const session = await (betterAuthInstance as any).api.getMcpSession({
        headers: req.headers as unknown as HeadersInit,
      });

      if (!session) {
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
        const config = await (
          betterAuthInstance as any
        ).api.getMcpOAuthConfig();
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
