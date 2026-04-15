import {
  RequestHandlerAndRouter,
  Middleware,
  MiddlewareProviderFactory,
  MiddlewareProviderFactoryContext,
  ResolvedMiddlewareProvider,
} from "@/types/middleware";
import { Router, type RequestHandler } from "express";

export type Provider = ResolvedMiddlewareProvider;

export type ProvidersModel = Provider[];

// assertion functions to get the type of the middleware and router
function isRequestHandler(
  middleware: Middleware
): middleware is RequestHandler {
  return typeof middleware === "function";
}

function isRequestHandlerAndRouter(
  middleware: Middleware
): middleware is RequestHandlerAndRouter {
  return (
    typeof middleware === "object" &&
    middleware !== null &&
    "middleware" in middleware &&
    "router" in middleware &&
    typeof middleware.middleware === "function" &&
    isExpressRouter(middleware.router)
  );
}

function isMiddlewareProviderFactory(
  middleware: Middleware
): middleware is MiddlewareProviderFactory {
  return (
    typeof middleware === "object" &&
    middleware !== null &&
    "resolve" in middleware &&
    typeof middleware.resolve === "function"
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

// read from the array of providers (middlewares and/or routers) and split them into ordered items preserving sequence
async function resolveProviderFactory(
  middleware: MiddlewareProviderFactory,
  context: MiddlewareProviderFactoryContext
): Promise<Provider | null> {
  const resolved = await middleware.resolve(context);

  if (!resolved) {
    return null;
  }

  if (resolved.router && !isExpressRouter(resolved.router)) {
    throw new Error("[xmcp] Middleware provider factory returned an invalid router");
  }

  if (
    resolved.middleware &&
    typeof resolved.middleware !== "function"
  ) {
    throw new Error(
      "[xmcp] Middleware provider factory returned an invalid middleware handler"
    );
  }

  return resolved;
}

// read from the array of providers (middlewares and/or routers) and split them into ordered items preserving sequence
export async function processProviders(
  defaultExport: Middleware | Middleware[],
  context: MiddlewareProviderFactoryContext
): Promise<ProvidersModel> {
  const providers: ProvidersModel = [];

  if (Array.isArray(defaultExport)) {
    for (const middleware of defaultExport) {
      if (isRequestHandler(middleware)) {
        providers.push({ middleware });
      } else if (isRequestHandlerAndRouter(middleware)) {
        providers.push({
          middleware: middleware.middleware,
          router: middleware.router,
        });
      } else if (isMiddlewareProviderFactory(middleware)) {
        const provider = await resolveProviderFactory(middleware, context);
        if (provider) {
          providers.push(provider);
        }
      }
    }
  } else {
    // if it's not an array return it as an array anyways
    if (isRequestHandler(defaultExport)) {
      providers.push({ middleware: defaultExport });
    } else if (isRequestHandlerAndRouter(defaultExport)) {
      providers.push({
        middleware: defaultExport.middleware,
        router: defaultExport.router,
      });
    } else if (isMiddlewareProviderFactory(defaultExport)) {
      const provider = await resolveProviderFactory(defaultExport, context);
      if (provider) {
        providers.push(provider);
      }
    }
  }

  return providers;
}
