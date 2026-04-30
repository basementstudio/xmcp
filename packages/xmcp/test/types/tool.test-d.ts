import { describe, expectTypeOf, test } from "vitest";
import { z } from "zod/v3";
import type {
  ElicitResult,
  InferSchema,
  ToolExtraArguments,
  ToolMetadata,
  ToolOutputSchema,
  ToolSchema,
} from "xmcp";

// Pin the public Tool surface. These assertions fail to compile if a public
// type signature changes — the runtime tests in test/unit/ won't catch
// signature drift on its own.

describe("ToolMetadata", () => {
  test("name and description are required", () => {
    // A literal with only the required fields must satisfy ToolMetadata.
    const minimal: ToolMetadata = { name: "echo", description: "Echo a msg" };
    expectTypeOf(minimal).toEqualTypeOf<ToolMetadata>();
  });

  test("name is string", () => {
    expectTypeOf<ToolMetadata["name"]>().toEqualTypeOf<string>();
    expectTypeOf<ToolMetadata["description"]>().toEqualTypeOf<string>();
  });
});

describe("ToolSchema / ToolOutputSchema", () => {
  test("zod v3 records satisfy the schema shape", () => {
    expectTypeOf<{ message: z.ZodString }>().toExtend<ToolSchema>();
    expectTypeOf<{ ok: z.ZodBoolean }>().toExtend<ToolOutputSchema>();
  });
});

describe("InferSchema", () => {
  test("v3 zod schema infers to the runtime shape", () => {
    type Schema = { message: z.ZodString; count: z.ZodNumber };
    expectTypeOf<InferSchema<Schema>>().toEqualTypeOf<{
      message: string;
      count: number;
    }>();
  });

  test("optional fields stay optional", () => {
    type Schema = { name: z.ZodOptional<z.ZodString> };
    expectTypeOf<InferSchema<Schema>>().toEqualTypeOf<{
      name: string | undefined;
    }>();
  });
});

describe("ToolExtraArguments", () => {
  test("authInfo is optional but token/clientId/scopes are required when present", () => {
    expectTypeOf<ToolExtraArguments>()
      .toHaveProperty("signal")
      .toEqualTypeOf<AbortSignal>();
    expectTypeOf<ToolExtraArguments>()
      .toHaveProperty("requestId")
      .toEqualTypeOf<string | number>();
    expectTypeOf<
      NonNullable<ToolExtraArguments["authInfo"]>
    >().toMatchObjectType<{
      token: string;
      clientId: string;
      scopes: string[];
    }>();
  });

  test("elicit returns an ElicitResult promise", () => {
    type ElicitFn = ToolExtraArguments["elicit"];
    expectTypeOf<ReturnType<ElicitFn>>().toEqualTypeOf<Promise<ElicitResult>>();
  });
});
