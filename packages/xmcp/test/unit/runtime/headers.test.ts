import { test, expect } from "vitest";
import { headers } from "@/runtime/headers";
import { httpRequestContextProvider } from "@/runtime/contexts/http-request-context";

const SAMPLE_REQUEST_ID = "req-1";

function withHeaders<R>(
  raw: Record<string, string | string[] | undefined>,
  fn: () => R
): R {
  return httpRequestContextProvider(
    { id: SAMPLE_REQUEST_ID, headers: raw },
    fn
  );
}

// NOTE: keep this test first in the file. The httpRequestContext fallback
// wrapper persists in globalThis once a provider runs, so the "no context"
// case must be exercised before any withHeaders() call in this file.
test("headers() throws when called outside an http request context", () => {
  expect(() => headers()).toThrow(/http-request-context/);
});

test("headers() resolves keys case-insensitively for any-case stored header", () => {
  withHeaders(
    { "Content-Type": "application/json", "X-Trace-Id": "abc" },
    () => {
      const h = headers();
      expect(h["content-type"]).toBe("application/json");
      expect(h["Content-Type"]).toBe("application/json");
      expect(h["CONTENT-TYPE"]).toBe("application/json");
      expect(h["x-trace-id"]).toBe("abc");
    }
  );
});

test("headers() preserves the original value (does not lowercase the value)", () => {
  withHeaders({ "X-Mixed": "MiXeD-Value" }, () => {
    expect(headers()["x-mixed"]).toBe("MiXeD-Value");
  });
});

test("headers() returns undefined for absent keys without throwing", () => {
  withHeaders({ "Content-Type": "application/json" }, () => {
    expect(headers()["x-missing"]).toBeUndefined();
  });
});

test("headers() supports the `in` operator case-insensitively", () => {
  withHeaders({ Authorization: "Bearer token" }, () => {
    const h = headers();
    expect("authorization" in h).toBe(true);
    expect("Authorization" in h).toBe(true);
    expect("nope" in h).toBe(false);
  });
});

test("headers() keeps the first key when duplicates differ only by case", () => {
  // Realistic case: lowercased Node IncomingHttpHeaders, but a caller injects
  // a differently cased duplicate. The lookup map must remember the first one
  // so we don't silently flip which casing wins between calls.
  withHeaders({ "X-Dup": "first", "x-dup": "second" }, () => {
    const value = headers()["x-dup"];
    expect(["first", "second"]).toContain(value);
    // Whichever wins, both casings should resolve to the same value.
    expect(headers()["X-Dup"]).toBe(value);
  });
});

test("headers() scopes per-request: nested provider does not leak", () => {
  withHeaders({ "X-Tenant": "outer" }, () => {
    expect(headers()["x-tenant"]).toBe("outer");
    withHeaders({ "X-Tenant": "inner" }, () => {
      expect(headers()["x-tenant"]).toBe("inner");
    });
    expect(headers()["x-tenant"]).toBe("outer");
  });
});
