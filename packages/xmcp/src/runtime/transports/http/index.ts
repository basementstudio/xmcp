import { RequestHandler, Router } from "express";
import { createServer } from "../../utils/server";
import { StatelessStreamableHTTPTransport } from "./stateless-streamable-http";
import { OAuthConfigOptions } from "../../../auth/oauth/types";
import { Middleware } from "../../../types/middleware";
import { CorsConfig } from "@/compiler/config/schemas";
import { processMiddleware } from "@/auth";

// by the time this is run, the config is already parsed and injected as object
// the injection handles the boolean case
// perhaps this should be an exported type from the compiler config
type RuntimeHttpConfig = {
  port?: number;
  host?: string;
  bodySizeLimit?: number;
  debug?: boolean;
  endpoint?: string;
  stateless?: boolean; // stateless right now is the only option supported
};

// @ts-expect-error: injected by compiler
const httpConfig = HTTP_CONFIG as RuntimeHttpConfig;
// @ts-expect-error: injected by compiler
const corsConfig = HTTP_CORS_CONFIG as CorsConfig;

// middleware
// @ts-expect-error: injected by compiler
const middleware = INJECTED_MIDDLEWARE as () =>
  | Promise<{
      default: Middleware[];
    }>
  | undefined;

// oauth config
// @ts-expect-error: injected by compiler
const oauthConfig = OAUTH_CONFIG as OAuthConfigOptions | undefined;

// better auth
// @ts-expect-error: injected by compiler
const betterAuth = BETTER_AUTH as BetterAuthInstance | undefined;

async function main() {
  const options = {
    port: httpConfig?.port,
    host: httpConfig?.host,
    debug: httpConfig?.debug,
    bodySizeLimit: httpConfig?.bodySizeLimit?.toString(),
    endpoint: httpConfig?.endpoint,
  };

  const corsOptions = {
    origin: corsConfig.origin,
    methods: corsConfig.methods,
    allowedHeaders: corsConfig.allowedHeaders,
    exposedHeaders: corsConfig.exposedHeaders,
    credentials: corsConfig.credentials,
    maxAge: corsConfig.maxAge,
  };

  let middlewares;
  let routers;

  // process the middleware content
  if (middleware) {
    const middlewareModule = await middleware();
    if (middlewareModule && middlewareModule.default) {
      const defaultExport = middlewareModule.default;

      const { middlewaresList, routersList } = processMiddleware(defaultExport);

      middlewares = middlewaresList;
      routers = routersList;
    }
  }

  /* if (middleware) {
    const middlewareModule = await middleware();
    if (middlewareModule && middlewareModule.default) {
      const defaultExport = middlewareModule.default;
      if (Array.isArray(defaultExport)) {
        // Handle array of middlewares
        middlewareFn = defaultExport.filter(
          (mw): mw is RequestHandler => typeof mw === "function"
        );
      } else if (typeof defaultExport === "function") {
        // Handle single middleware
        middlewareFn = [defaultExport];
      } else {
        throw new Error(
          "Middleware module does not export a valid RequestHandler or array of RequestHandlers"
        );
      }
    } else {
      throw new Error("Middleware module does not export a default middleware");
    }
  } */

  const transport = new StatelessStreamableHTTPTransport(
    createServer,
    options,
    corsOptions,
    oauthConfig,
    middlewares,
    routers
  );
  await transport.start();
}

main();
