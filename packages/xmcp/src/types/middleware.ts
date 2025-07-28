import { type RequestHandler, type Router } from "express";

export type MiddlewareAndRouter = {
  middleware: RequestHandler;
  router: Router;
};

export type Middleware = RequestHandler | MiddlewareAndRouter;
