import type { RequestHandler, Router } from "express";
import { describe, expectTypeOf, test } from "vitest";
import type { Middleware, WebMiddleware, WebMiddlewareContext } from "xmcp";

// Express-style Middleware union and the platform-agnostic WebMiddleware
// must both stay valid. PR #503 surfaced that a per-tool wrapper requirement
// is a DX failure — locking these signatures so a refactor that narrows
// them gets caught at compile time.

describe("Middleware", () => {
  test("plain RequestHandler satisfies Middleware", () => {
    expectTypeOf<RequestHandler>().toExtend<Middleware>();
  });

  test("router-bundled middleware also satisfies Middleware", () => {
    expectTypeOf<{
      middleware: RequestHandler;
      router: Router;
    }>().toExtend<Middleware>();
  });
});

describe("WebMiddleware", () => {
  test("accepts the (request, context) signature", () => {
    expectTypeOf<WebMiddleware>().parameters.toEqualTypeOf<
      [Request, WebMiddlewareContext]
    >();
  });

  test("may return Response, void, or a Promise of either", () => {
    expectTypeOf<WebMiddleware>().returns.toEqualTypeOf<
      Promise<Response | void> | Response | void
    >();
  });
});

describe("WebMiddlewareContext", () => {
  test("setAuth writes AuthInfo, auth is optional", () => {
    expectTypeOf<WebMiddlewareContext>().toHaveProperty("setAuth");
    expectTypeOf<WebMiddlewareContext["auth"]>().toBeNullable();
  });
});
