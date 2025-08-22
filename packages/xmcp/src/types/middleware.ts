import { type RequestHandler, type Router } from "express";

export type RequestHandlerAndRouter = {
  middleware: RequestHandler;
  router: Router;
};

export type Middleware = RequestHandler | RequestHandlerAndRouter;
