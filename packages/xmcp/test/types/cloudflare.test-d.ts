import { describe, expectTypeOf, test } from "vitest";
import {
  apiKeyAuthMiddleware,
  jwtAuthMiddleware,
  type JWTAuthMiddlewareConfig,
  type WebMiddleware,
} from "xmcp/cloudflare";

// The /cloudflare entry exposes Workers-flavoured auth middleware. They must
// remain assignable to WebMiddleware so users can drop them into the same
// middleware slot as a hand-written one.

describe("xmcp/cloudflare auth middlewares", () => {
  test("apiKeyAuthMiddleware return type is a WebMiddleware", () => {
    expectTypeOf<
      ReturnType<typeof apiKeyAuthMiddleware>
    >().toExtend<WebMiddleware>();
  });

  test("jwtAuthMiddleware return type is a WebMiddleware", () => {
    expectTypeOf<
      ReturnType<typeof jwtAuthMiddleware>
    >().toExtend<WebMiddleware>();
  });

  test("JWTAuthMiddlewareConfig is exported and usable", () => {
    expectTypeOf<JWTAuthMiddlewareConfig>().not.toBeNever();
  });
});
