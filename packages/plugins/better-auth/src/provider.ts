import { fromNodeHeaders, toNodeHandler } from "better-auth/node";
import { betterAuth } from "better-auth";
import {
  NextFunction,
  Router,
  type RequestHandler,
  Request,
  Response,
} from "express";
import { mcp } from "better-auth/plugins";
import path from "path";
import express from "express";
import { betterAuthContextProvider } from "./context.js";
import { fileURLToPath } from "url";
import { Database } from "./databases.js";
import { XmcpMiddleware } from "xmcp";
import { getHttpTransportContext } from "xmcp/utils";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.join(__dirname, "..");

const authUiPath = path.join(packageRoot, "auth-ui");

export type BetterAuthConfig = {
  database: Database;
  baseURL: string;
  secret: string;
  providers?: {
    emailAndPassword?: boolean;
    google?: {
      clientId: string;
      clientSecret: string;
    };
  };
};

export type SignInPage = "google" | "email" | "email-google";

function getBetterAuthInstance(auth: BetterAuthConfig): any {
  const betterAuthInstance = betterAuth({
    database: auth.database,
    baseURL: auth.baseURL,
    secret: auth.secret,
    ...(auth.providers?.emailAndPassword && {
      emailAndPassword: {
        enabled: auth.providers.emailAndPassword,
      },
    }),
    ...(auth.providers?.google && {
      socialProviders: {
        google: {
          clientId: auth.providers.google.clientId,
          clientSecret: auth.providers.google.clientSecret,
          redirectURI: `${auth.baseURL}/auth/callback/google`,
        },
      },
    }),
    plugins: [mcp({ loginPage: "/auth/sign-in" })],
  });

  return betterAuthInstance;
}

export type BetterAuthInstanceWithMcp = ReturnType<
  typeof getBetterAuthInstance
>;

export function betterAuthProvider(auth: BetterAuthConfig): XmcpMiddleware {
  const betterAuthInstance = getBetterAuthInstance(auth);

  return {
    middleware: betterAuthMiddleware(betterAuthInstance),
    router: betterAuthRouter(betterAuthInstance, auth),
  };
}

export function betterAuthRouter(
  betterAuthInstance: BetterAuthInstanceWithMcp,
  authConfig: BetterAuthConfig
): Router {
  const router = Router();

  router.use((req: Request, _res: Response, next: NextFunction) => {
    betterAuthContextProvider(
      {
        api: betterAuthInstance,
        headers: req.headers,
      },
      () => {
        next();
      }
    );
  });

  // TODO: create an object
  // get config to render sign in page
  router.get("/auth/config", (_req, res) => {
    if (
      authConfig.providers?.google &&
      !authConfig.providers.emailAndPassword
    ) {
      res.json("google");
    } else if (
      authConfig.providers?.emailAndPassword &&
      !authConfig.providers.google
    ) {
      res.json("email");
    } else if (
      authConfig.providers?.emailAndPassword &&
      authConfig.providers.google
    ) {
      res.json("email-google");
    } else {
      res.status(500).json({ error: "No providers configured" });
    }
  });

  // serve auth ui
  router.use("/auth", express.static(authUiPath));

  router.all("/api/auth/*", toNodeHandler(betterAuthInstance));

  // google callback custom to handle redirect
  if (authConfig.providers?.google) {
    router.get("/auth/callback/google", (_req, res) => {
      res.sendFile(path.join(authUiPath, "index.html"));
    });
  }

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const config = await betterAuthInstance.api.getMcpOAuthConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get OAuth config" });
    }
  });

  router.get("/auth/sign-in", (_req, res) => {
    res.sendFile(path.join(authUiPath, "index.html"));
  });

  return router;
}

export function betterAuthMiddleware(
  betterAuthInstance: BetterAuthInstanceWithMcp
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { endpoint } = getHttpTransportContext().config.http || {};

    if (!req.path.startsWith(endpoint || "/mcp")) {
      next();
      return;
    }

    try {
      const config = await betterAuthInstance.api.getMcpOAuthConfig();

      // get session
      const session = await betterAuthInstance.api.getMcpSession({
        headers: fromNodeHeaders(req.headers),
      });

      if (!session) {
        // return oauth authorization server config
        res.status(401).json(config);
        return;
      }

      // session is valid, proceed to next middleware
      next();
    } catch (error) {
      // on auth error, return authorization server config
      try {
        const config = await betterAuthInstance.api.getMcpOAuthConfig();
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
