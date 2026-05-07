import { test, expect } from "vitest";
import { z as z3 } from "zod/v3";
import { z as z4 } from "zod/v4";
import { configSchema } from "@/compiler/config";

// xmcp accepts user tool schemas authored against either zod v3 or v4 — see
// CompatibleZodType in src/types/tool.ts. The package's own schemas (config,
// auth, etc) are pinned to "zod/v3", but the runtime sits in front of user
// schemas that may come from "zod/v4". These tests pin the cross-version
// invariants the framework relies on so a future zod/v4 import-path or shape
// change doesn't silently break user tool schemas.

test("zod v3 and v4 are both resolvable as separate modules", () => {
  expect(z3).not.toBe(z4);
  expect(typeof z3.object).toBe("function");
  expect(typeof z4.object).toBe("function");
});

test("a representative tool input schema parses identically under v3 and v4", () => {
  // Mirrors the kinds of shapes user tools declare (string + number + optional + enum).
  const input = { city: "Buenos Aires", units: "metric" as const, days: 3 };

  const v3Schema = z3.object({
    city: z3.string().min(1),
    units: z3.enum(["metric", "imperial"]).optional(),
    days: z3.number().int().positive(),
  });

  const v4Schema = z4.object({
    city: z4.string().min(1),
    units: z4.enum(["metric", "imperial"]).optional(),
    days: z4.number().int().positive(),
  });

  expect(v3Schema.parse(input)).toEqual(input);
  expect(v4Schema.parse(input)).toEqual(input);
});

test("invalid inputs are rejected by both v3 and v4 schemas", () => {
  const v3Schema = z3.object({ city: z3.string().min(1) });
  const v4Schema = z4.object({ city: z4.string().min(1) });

  expect(() => v3Schema.parse({ city: "" })).toThrow();
  expect(() => v4Schema.parse({ city: "" })).toThrow();
  expect(() => v3Schema.parse({ city: 42 } as any)).toThrow();
  expect(() => v4Schema.parse({ city: 42 } as any)).toThrow();
});

test("zod v4 raw shape entries expose .parse — used by transformToolHandler", () => {
  // src/runtime/utils/transformers/tool.ts walks ZodRawShape entries and calls
  // fieldSchema.parse(value). The same surface must exist on v4 field schemas.
  const v4Shape = {
    city: z4.string(),
    days: z4.number(),
  };
  expect(typeof v4Shape.city.parse).toBe("function");
  expect(v4Shape.city.parse("BA")).toBe("BA");
  expect(v4Shape.days.parse(3)).toBe(3);
});

test("xmcp configSchema (pinned to zod/v3) accepts a typical user config", () => {
  // Sanity check that the package-internal schema still parses a representative
  // config — i.e. our v3 pin hasn't drifted out from under the rest of the code.
  const parsed = configSchema.parse({
    http: { port: 3001 },
    stdio: true,
  });
  expect(parsed.http).toBeDefined();
  expect(parsed.stdio).toBeDefined();
});
