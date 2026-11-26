import assert from "node:assert";
import { test } from "node:test";

import { resolveRequestOrigin } from "../request-origin";

test("resolveRequestOrigin keeps valid forwarded http and https values", () => {
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedProto: "https",
      forwardedHost: "mcp.example.com",
      protocol: "http",
      host: "internal:3001",
    }),
    "https://mcp.example.com"
  );
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedProto: "http",
      protocol: "https",
      host: "mcp.example.com",
    }),
    "http://mcp.example.com"
  );
});

test("resolveRequestOrigin falls back when forwarded proto is not http or https", () => {
  for (const forwardedProto of ["https://other.example/#", "javascript"]) {
    assert.strictEqual(
      resolveRequestOrigin({
        forwardedProto,
        protocol: "http",
        host: "mcp.example.com",
      }),
      "http://mcp.example.com"
    );
  }
});

test("resolveRequestOrigin uses http when no protocol is valid", () => {
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedProto: "ftp",
      protocol: "ws",
      host: "mcp.example.com",
    }),
    "http://mcp.example.com"
  );
});

test("resolveRequestOrigin takes the first forwarded proto value", () => {
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedProto: "https, http",
      protocol: "http",
      host: "mcp.example.com",
    }),
    "https://mcp.example.com"
  );
});

test("resolveRequestOrigin normalizes uppercase proto", () => {
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedProto: "HTTPS",
      protocol: "http",
      host: "mcp.example.com",
    }),
    "https://mcp.example.com"
  );
});

test("resolveRequestOrigin rejects forwarded hosts with URL delimiters or spaces", () => {
  for (const forwardedHost of [
    "other.example/path",
    "other.example#",
    "user@other.example",
    "other .example",
    "other.example\\x",
    "other.example?x",
  ]) {
    assert.strictEqual(
      resolveRequestOrigin({
        forwardedProto: "https",
        forwardedHost,
        protocol: "http",
        host: "mcp.example.com",
      }),
      "https://mcp.example.com",
      `forwarded host ${JSON.stringify(forwardedHost)} should be rejected`
    );
  }
});

test("resolveRequestOrigin uses localhost when both hosts are invalid", () => {
  assert.strictEqual(
    resolveRequestOrigin({
      forwardedHost: "a/b",
      protocol: "http",
      host: "c#d",
    }),
    "http://localhost"
  );
  assert.strictEqual(
    resolveRequestOrigin({ protocol: "http" }),
    "http://localhost"
  );
});

test("resolveRequestOrigin keeps host:port and IPv6 hosts", () => {
  assert.strictEqual(
    resolveRequestOrigin({ protocol: "http", host: "localhost:3001" }),
    "http://localhost:3001"
  );
  assert.strictEqual(
    resolveRequestOrigin({ protocol: "http", host: "127.0.0.1:8080" }),
    "http://127.0.0.1:8080"
  );
  assert.strictEqual(
    resolveRequestOrigin({ protocol: "http", host: "[::1]:3001" }),
    "http://[::1]:3001"
  );
});

test("resolveRequestOrigin rejects out-of-range ports", () => {
  for (const host of ["mcp.example.com:0", "mcp.example.com:65536"]) {
    assert.strictEqual(
      resolveRequestOrigin({ protocol: "http", host }),
      "http://localhost"
    );
  }
});
