import assert from "node:assert";
import { test } from "node:test";

import type { Request } from "express";

import { buildBaseUrl, buildResourceMetadataUrl } from "../xmcp.utils";

function fakeRequest(
  headers: Record<string, string>,
  protocol = "http"
): Request {
  return {
    headers,
    protocol,
    get: (name: string) => headers[name.toLowerCase()],
  } as unknown as Request;
}

test("buildBaseUrl honors valid forwarded headers", () => {
  const req = fakeRequest({
    host: "internal:3000",
    "x-forwarded-proto": "https",
    "x-forwarded-host": "mcp.example.com",
  });

  assert.strictEqual(buildBaseUrl(req), "https://mcp.example.com");
  assert.strictEqual(
    buildResourceMetadataUrl(req),
    "https://mcp.example.com/.well-known/oauth-protected-resource"
  );
});

test("buildBaseUrl ignores invalid forwarded headers", () => {
  const req = fakeRequest({
    host: "mcp.example.com",
    "x-forwarded-proto": "https://other.example/#",
    "x-forwarded-host": "other.example/#",
  });

  assert.strictEqual(buildBaseUrl(req), "http://mcp.example.com");
});
