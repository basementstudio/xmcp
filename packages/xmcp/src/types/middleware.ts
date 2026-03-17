import type { RequestHandler, Router } from "express";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

export type RequestHandlerAndRouter = {
  middleware: RequestHandler;
  router: Router;
};

export type Middleware = RequestHandler | RequestHandlerAndRouter;

export type WebMiddlewareContext = {
  auth?: AuthInfo;
  setAuth: (auth: AuthInfo) => void;
};

export type WebMiddleware = (
  request: Request,
  context: WebMiddlewareContext
) => Promise<Response | void> | Response | void;
