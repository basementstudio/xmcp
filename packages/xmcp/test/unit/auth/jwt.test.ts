import { test, expect, vi } from "vitest";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { jwtAuthMiddleware } from "@/auth/jwt";

const SECRET = "test-secret";

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

test("jwtAuthMiddleware accepts a valid token and populates req.user", () => {
  const token = jwt.sign({ sub: "user-1", name: "ada" }, SECRET, {
    algorithm: "HS256",
  });
  const middleware = jwtAuthMiddleware({
    secret: SECRET,
    algorithms: ["HS256"],
  });
  const req = makeReq({ Authorization: `Bearer ${token}` });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).toHaveBeenCalledOnce();
  expect((req as any).user).toMatchObject({ sub: "user-1", name: "ada" });
  expect((res as any).statusCode).toBe(0);
});

test("jwtAuthMiddleware rejects an expired token", () => {
  const token = jwt.sign({ sub: "user-1" }, SECRET, {
    algorithm: "HS256",
    expiresIn: "-1s",
  });
  const middleware = jwtAuthMiddleware({
    secret: SECRET,
    algorithms: ["HS256"],
  });
  const req = makeReq({ Authorization: `Bearer ${token}` });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({
    error: "Unauthorized: Invalid or expired token",
  });
});

test("jwtAuthMiddleware rejects a malformed token", () => {
  const middleware = jwtAuthMiddleware({
    secret: SECRET,
    algorithms: ["HS256"],
  });
  const req = makeReq({ Authorization: "Bearer not-a-jwt" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({
    error: "Unauthorized: Invalid or expired token",
  });
});

test("jwtAuthMiddleware rejects a token signed with a different secret", () => {
  const token = jwt.sign({ sub: "user-1" }, "other-secret", {
    algorithm: "HS256",
  });
  const middleware = jwtAuthMiddleware({
    secret: SECRET,
    algorithms: ["HS256"],
  });
  const req = makeReq({ Authorization: `Bearer ${token}` });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
});

test("jwtAuthMiddleware enforces verify options (issuer mismatch)", () => {
  const token = jwt.sign({ sub: "user-1" }, SECRET, {
    algorithm: "HS256",
    issuer: "https://wrong.example",
  });
  const middleware = jwtAuthMiddleware({
    secret: SECRET,
    algorithms: ["HS256"],
    issuer: "https://example.com",
  });
  const req = makeReq({ Authorization: `Bearer ${token}` });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
});

test("jwtAuthMiddleware rejects when Authorization header is missing", () => {
  const middleware = jwtAuthMiddleware({ secret: SECRET });
  const req = makeReq();
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({
    error: "Unauthorized: Missing or malformed Authorization header",
  });
});

test("jwtAuthMiddleware rejects a non-Bearer scheme", () => {
  const middleware = jwtAuthMiddleware({ secret: SECRET });
  const req = makeReq({ Authorization: "Basic dXNlcjpwYXNz" });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({
    error: "Unauthorized: Missing or malformed Authorization header",
  });
});

test("jwtAuthMiddleware rejects an empty Bearer token", () => {
  const middleware = jwtAuthMiddleware({ secret: SECRET });
  const req = makeReq({ Authorization: "Bearer    " });
  const res = makeRes();
  const next = vi.fn() as unknown as NextFunction;

  middleware(req, res, next);

  expect(next).not.toHaveBeenCalled();
  expect((res as any).statusCode).toBe(401);
  expect((res as any).body).toEqual({
    error: "Unauthorized: Missing access token",
  });
});
