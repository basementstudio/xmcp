import { describe, it, expect, beforeEach } from "vitest";
import { x402Registry } from "../../src/registry.js";

// X402ToolOptions is sourced from `xmcp/plugins/x402` and only ever appears in
// type positions inside registry.ts. Cast through `unknown` so the test stays
// runnable without a built xmcp package — the registry doesn't validate shape
// at runtime, so any object is fine for round-trip assertions.
const stubOptions = (price: string) =>
  ({ price, network: "base", asset: "usdc" }) as unknown as Parameters<
    typeof x402Registry.register
  >[1];

describe("x402Registry", () => {
  beforeEach(() => {
    // The registry is a globalThis-backed singleton — anything written by a
    // sibling test would persist into the next case otherwise.
    x402Registry.clear();
  });

  it("starts empty after clear()", () => {
    expect(x402Registry.has("anything")).toBe(false);
    expect(x402Registry.get("anything")).toBeUndefined();
  });

  it("register → has → get round-trip preserves the same options object", () => {
    const opts = stubOptions("0.01");
    x402Registry.register("greet", opts);
    expect(x402Registry.has("greet")).toBe(true);
    expect(x402Registry.get("greet")).toBe(opts);
  });

  it("register on an existing key overwrites — last write wins", () => {
    const a = stubOptions("0.01");
    const b = stubOptions("0.02");
    x402Registry.register("echo", a);
    x402Registry.register("echo", b);
    expect(x402Registry.get("echo")).toBe(b);
  });

  it("clear() removes every entry", () => {
    x402Registry.register("one", stubOptions("0.01"));
    x402Registry.register("two", stubOptions("0.02"));
    x402Registry.clear();
    expect(x402Registry.has("one")).toBe(false);
    expect(x402Registry.has("two")).toBe(false);
  });
});
