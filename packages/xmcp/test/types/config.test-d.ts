import type { RspackOptions } from "@rspack/core";
import { describe, expectTypeOf, test } from "vitest";
import type { XmcpConfig } from "xmcp";

// The XmcpConfig surface is the user-facing contract for xmcp.config.ts.
// PR #498 surfaced that new fields default to optional (Rule 6 in
// .claude/review-rules.md) — these assertions guard against accidental
// `required` flips.

describe("XmcpConfig", () => {
  test("empty config is valid (every top-level field optional)", () => {
    const empty: XmcpConfig = {};
    expectTypeOf(empty).toEqualTypeOf<XmcpConfig>();
  });

  test("transports are optional", () => {
    expectTypeOf<XmcpConfig>().toHaveProperty("http").toBeNullable();
    expectTypeOf<XmcpConfig>().toHaveProperty("stdio").toBeNullable();
  });

  test("paths/experimental/template/typescript stay optional", () => {
    expectTypeOf<XmcpConfig>().toHaveProperty("paths").toBeNullable();
    expectTypeOf<XmcpConfig>().toHaveProperty("experimental").toBeNullable();
    expectTypeOf<XmcpConfig>().toHaveProperty("template").toBeNullable();
    expectTypeOf<XmcpConfig>().toHaveProperty("typescript").toBeNullable();
  });

  test("bundler is a function returning RspackOptions", () => {
    type Bundler = NonNullable<XmcpConfig["bundler"]>;
    expectTypeOf<Bundler>().toEqualTypeOf<
      (config: RspackOptions) => RspackOptions
    >();
  });

  test("realistic config shape compiles", () => {
    const cfg: XmcpConfig = {
      http: { port: 3000 },
      stdio: true,
      paths: { tools: "src/tools/**/*.ts" },
      bundler: (c) => c,
    };
    expectTypeOf(cfg).toEqualTypeOf<XmcpConfig>();
  });
});
