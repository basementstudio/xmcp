import { XmcpMiddleware } from "@/types/middleware";
import { Router } from "express";

// create a dummy middleware that is the type of middleware
export function dummyMiddleware(): XmcpMiddleware {
  return (req, res, next) => {
    console.log("dummyMiddleware");
    next();
  };
}

// create a dummy middleware that is the type of middleware and router
export function dummyMiddlewareAndRouter(): XmcpMiddleware {
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
