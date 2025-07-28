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

export type MiddlewareAndRouter = {
  middleware: RequestHandler;
  router: Router;
};

export type Middleware = RequestHandler | MiddlewareAndRouter;

export type MiddlewareModel = {
  middlewaresList: RequestHandler[];
  routersList: Router[];
};

// assertion functions to get the type of the middleware and router
function isRequestHandler(
  middleware: Middleware
): middleware is RequestHandler {
  return typeof middleware === "function";
}

function isMiddlewareAndRouter(
  middleware: Middleware
): middleware is MiddlewareAndRouter {
  return (
    typeof middleware === "object" &&
    middleware !== null &&
    "middleware" in middleware &&
    "router" in middleware &&
    typeof middleware.middleware === "function" &&
    isExpressRouter(middleware.router)
  );
}

function isExpressRouter(obj: any): obj is Router {
  return (
    typeof obj === "function" &&
    obj !== null &&
    typeof obj.use === "function" &&
    typeof obj.get === "function" &&
    typeof obj.post === "function" &&
    typeof obj.route === "function"
  );
}

// read from the array of middlewares and split them into list of middlewares and list of routers
export function processMiddleware(
  defaultExport: Middleware | Middleware[]
): MiddlewareModel {
  const middlewaresList: RequestHandler[] = [];
  const routersList: Router[] = [];

  if (Array.isArray(defaultExport)) {
    for (const middleware of defaultExport) {
      if (isRequestHandler(middleware)) {
        middlewaresList.push(middleware);
      } else if (isMiddlewareAndRouter(middleware)) {
        middlewaresList.push(middleware.middleware);
        routersList.push(middleware.router);
      }
    }
  } else {
    // if it's not an array return it as an array anyways
    if (isRequestHandler(defaultExport)) {
      middlewaresList.push(defaultExport);
    } else if (isMiddlewareAndRouter(defaultExport)) {
      middlewaresList.push(defaultExport.middleware);
      routersList.push(defaultExport.router);
    }
  }

  return {
    middlewaresList,
    routersList,
  };
}

// create a dummy middleware that is the type of middleware
export function dummyMiddleware(): Middleware {
  return (req, res, next) => {
    console.log("dummyMiddleware");
    next();
  };
}

// create a dummy middleware that is the type of middleware and router
export function dummyMiddlewareAndRouter(): Middleware {
  return {
    middleware: (req, res, next) => {
      console.log("dummyMiddlewareAndRouter");
      next();
    },
    router: (() => {
      const router = Router();
      router.get("/random", (_req, res) => {
        res.json({ random: Math.random() });
      });
      return router;
    })(),
  };
}

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

export function betterAuthMiddlewareAndRouter(
  auth: BetterAuthConfig
): Middleware {
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
