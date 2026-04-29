import { test, expect } from "vitest";
import {
  corsConfigSchema,
  httpTransportConfigSchema,
} from "@/compiler/config/schemas/transport/http";

// Regression coverage for PR #552: the CORS defaults must always include the
// MCP protocol headers, regardless of whether the user supplies a partial
// override. Several MCP clients require `mcp-session-id` and
// `mcp-protocol-version` to be allowed and (for session-id) exposed.

test("default CORS config includes MCP headers in allowedHeaders", () => {
  const result = corsConfigSchema.parse({});
  expect(result.allowedHeaders).toEqual(
    expect.arrayContaining(["mcp-session-id", "mcp-protocol-version"])
  );
});

test("default CORS config includes mcp-session-id in exposedHeaders", () => {
  const result = corsConfigSchema.parse({});
  expect(result.exposedHeaders).toEqual(
    expect.arrayContaining(["mcp-session-id"])
  );
});

test("user-supplied allowedHeaders array is augmented with MCP headers", () => {
  const result = corsConfigSchema.parse({
    allowedHeaders: ["X-Custom"],
  });
  expect(result.allowedHeaders).toEqual(
    expect.arrayContaining([
      "X-Custom",
      "mcp-session-id",
      "mcp-protocol-version",
    ])
  );
});

test("user-supplied exposedHeaders array is augmented with mcp-session-id", () => {
  const result = corsConfigSchema.parse({
    exposedHeaders: ["X-Trace-Id"],
  });
  expect(result.exposedHeaders).toEqual(
    expect.arrayContaining(["X-Trace-Id", "mcp-session-id"])
  );
});

test("MCP headers are not duplicated when the user already lists them", () => {
  const result = corsConfigSchema.parse({
    allowedHeaders: ["mcp-session-id", "mcp-protocol-version", "X-Custom"],
    exposedHeaders: ["mcp-session-id", "X-Trace-Id"],
  });

  const allowedCount = (h: string) =>
    (result.allowedHeaders as string[]).filter((x) => x === h).length;
  const exposedCount = (h: string) =>
    (result.exposedHeaders as string[]).filter((x) => x === h).length;

  expect(allowedCount("mcp-session-id")).toBe(1);
  expect(allowedCount("mcp-protocol-version")).toBe(1);
  expect(exposedCount("mcp-session-id")).toBe(1);
});

test("string-form allowedHeaders is left untouched (no augmentation on strings)", () => {
  // The augmentation only fires when the value is an array — string overrides
  // are taken as-is. This is the documented behaviour and tests pin it so a
  // future refactor doesn't silently start mutating the string.
  const result = corsConfigSchema.parse({
    allowedHeaders: "X-Only",
  });
  expect(result.allowedHeaders).toBe("X-Only");
});

test("http transport with cors defaults still includes MCP headers", () => {
  const parsed = httpTransportConfigSchema.parse({});
  expect(parsed).not.toBe(null);
  if (typeof parsed !== "object" || parsed === null || parsed === true) {
    throw new Error("expected resolved http transport object");
  }
  expect(parsed.cors.allowedHeaders).toEqual(
    expect.arrayContaining(["mcp-session-id", "mcp-protocol-version"])
  );
  expect(parsed.cors.exposedHeaders).toEqual(
    expect.arrayContaining(["mcp-session-id"])
  );
});
