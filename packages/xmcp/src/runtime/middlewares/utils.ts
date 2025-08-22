import { RequestHandlerAndRouter, Middleware } from "@/types/middleware";
import { Router, type RequestHandler } from "express";

export type Provider = {
  middleware?: RequestHandler;
  router?: Router;
};

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
export function processProviders(
  defaultExport: Middleware | Middleware[]
): ProvidersModel {
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
    }
  }

  return providers;
}
