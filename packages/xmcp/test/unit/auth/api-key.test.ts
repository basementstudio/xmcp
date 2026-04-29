import { test, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { apiKeyAuthMiddleware } from "@/auth/api-key";

const ERROR_MSG = "Unauthorized: Missing or invalid API key";

function makeReq(headers: Record<string, string> = {}): Request {
  const lookup: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lookup[k.toLowerCase()] = v;
  }
  return {
    header(name: string) {
      return lookup[name.toLowerCase()];
    },
  } as unknown as Request;
}

function makeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(body: unknown) {
      this.body = body;
      return this;
    },
  };
  return res as unknown as Response & {
    statusCode: number;
    body: { error: string } | undefined;
  };
}

test("apiKeyAuthMiddleware accepts a matching static key on the default header", async () => {
  const middleware = apiKeyAuthMiddleware({ apiKey: "secret-123" });
  const req = makeReq({ "x-api-key": "secret-123" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(next).toHaveBeenCalledOnce();
  expect((res as any).statusCode).toBe(0);
});

test("apiKeyAuthMiddleware rejects when the static key does not match", async () => {
  const middleware = apiKeyAuthMiddleware({ apiKey: "secret-123" });
  const req = makeReq({ "x-api-key": "wrong" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({ error: ERROR_MSG });
});

test("apiKeyAuthMiddleware rejects when the configured header is absent", async () => {
  const middleware = apiKeyAuthMiddleware({ apiKey: "secret-123" });
  const req = makeReq();
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({ error: ERROR_MSG });
});

test("apiKeyAuthMiddleware honours a custom header name", async () => {
  const middleware = apiKeyAuthMiddleware({
    apiKey: "secret-123",
    headerName: "x-internal-token",
  });
  const req = makeReq({ "x-internal-token": "secret-123" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(next).toHaveBeenCalledOnce();
});

test("apiKeyAuthMiddleware ignores the default header name when a custom one is set", async () => {
  const middleware = apiKeyAuthMiddleware({
    apiKey: "secret-123",
    headerName: "x-internal-token",
  });
  const req = makeReq({ "x-api-key": "secret-123" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
});

test("apiKeyAuthMiddleware accepts a key approved by the custom validator", async () => {
  const validateApiKey = vi.fn(async (k: string) => k.startsWith("ok-"));
  const middleware = apiKeyAuthMiddleware({ validateApiKey });
  const req = makeReq({ "x-api-key": "ok-abc" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(validateApiKey).toHaveBeenCalledWith("ok-abc");
  expect(next).toHaveBeenCalledOnce();
});

test("apiKeyAuthMiddleware rejects a key the custom validator denies", async () => {
  const validateApiKey = vi.fn(async () => false);
  const middleware = apiKeyAuthMiddleware({ validateApiKey });
  const req = makeReq({ "x-api-key": "anything" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  await middleware(req, res, next);

  expect(validateApiKey).toHaveBeenCalledWith("anything");
  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({ error: ERROR_MSG });
});

test("apiKeyAuthMiddleware throws when both apiKey and validateApiKey are provided", () => {
  expect(() =>
    apiKeyAuthMiddleware({
      apiKey: "secret-123",
      // intentionally invalid combination
      validateApiKey: async () => true,
    } as any)
  ).toThrow(/mutually exclusive/);
});

test("apiKeyAuthMiddleware throws when neither apiKey nor validateApiKey is provided", () => {
  expect(() => apiKeyAuthMiddleware({} as any)).toThrow(/must be provided/);
});
