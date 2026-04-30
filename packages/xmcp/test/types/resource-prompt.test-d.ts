import { describe, expectTypeOf, test } from "vitest";
import type { PromptMetadata, ResourceMetadata } from "xmcp";

describe("ResourceMetadata", () => {
  test("name is the only required field", () => {
    const minimal: ResourceMetadata = { name: "doc" };
    expectTypeOf(minimal).toEqualTypeOf<ResourceMetadata>();
  });

  test("size is a number when present", () => {
    expectTypeOf<ResourceMetadata>()
      .toHaveProperty("size")
      .toEqualTypeOf<number | undefined>();
  });
});

describe("PromptMetadata", () => {
  test("name, title, description are required", () => {
    expectTypeOf<PromptMetadata>().toMatchObjectType<{
      name: string;
      title: string;
      description: string;
    }>();
  });

  test("role is optional", () => {
    expectTypeOf<PromptMetadata>()
      .toHaveProperty("role")
      .toEqualTypeOf<string | undefined>();
  });
});
