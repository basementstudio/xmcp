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
import fs from "fs";

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
  loginPage?: string;
};

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

export interface XmcpMiddleware {
  middleware?: RequestHandler;
  router?: Router;
}

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

  // serve auth ui
  router.use("/auth", express.static(authUiPath));

  router.all("/api/auth/*", toNodeHandler(betterAuthInstance));

  router.get("/.well-known/oauth-authorization-server", async (_req, res) => {
    try {
      const config = await betterAuthInstance.api.getMcpOAuthConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to get OAuth config" });
    }
  });

  router.get("/auth/sign-in", (_req, res) => {
    // Determine which HTML file to serve based on provider configuration
    let htmlFileName = "email.html"; // default fallback

    if (authConfig?.providers) {
      const { emailAndPassword, google } = authConfig.providers;

      // If both providers are enabled, use combined template
      if (emailAndPassword && google) {
        htmlFileName = "email-google.html";
      }
      // If only Google is enabled
      else if (google && !emailAndPassword) {
        htmlFileName = "google.html";
      }
      // If only email is enabled
      else if (emailAndPassword && !google) {
        htmlFileName = "email.html";
      }
    }

    const htmlPath = path.join(authUiPath, htmlFileName);

    // Check if file exists, fallback to email.html
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      const fallbackPath = path.join(authUiPath, "email.html");
      res.sendFile(fallbackPath);
    }
  });

  return router;
}

export function betterAuthMiddleware(
  betterAuthInstance: BetterAuthInstanceWithMcp
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
