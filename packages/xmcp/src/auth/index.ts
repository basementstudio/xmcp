import { Router, type RequestHandler } from "express";

export type RequestHandlerAndRouter = {
  middleware: RequestHandler;
  router: Router;
};

export type XmcpMiddleware = RequestHandler | RequestHandlerAndRouter;

export type MiddlewareModel = {
  middlewaresList: RequestHandler[];
  routersList: Router[];
};

// assertion functions to get the type of the middleware and router
function isRequestHandler(
  middleware: XmcpMiddleware
): middleware is RequestHandler {
  return typeof middleware === "function";
}

function isRequestHandlerAndRouter(
  middleware: XmcpMiddleware
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

// read from the array of middlewares and split them into list of middlewares and list of routers
export function processMiddleware(
  defaultExport: XmcpMiddleware | XmcpMiddleware[]
): MiddlewareModel {
  const middlewaresList: RequestHandler[] = [];
  const routersList: Router[] = [];

  if (Array.isArray(defaultExport)) {
    for (const middleware of defaultExport) {
      if (isRequestHandler(middleware)) {
        middlewaresList.push(middleware);
      } else if (isRequestHandlerAndRouter(middleware)) {
        middlewaresList.push(middleware.middleware);
        routersList.push(middleware.router);
      }
    }
  } else {
    // if it's not an array return it as an array anyways
    if (isRequestHandler(defaultExport)) {
      middlewaresList.push(defaultExport);
    } else if (isRequestHandlerAndRouter(defaultExport)) {
      middlewaresList.push(defaultExport.middleware);
      routersList.push(defaultExport.router);
    }
  }

  return {
    middlewaresList,
    routersList,
  };
}
