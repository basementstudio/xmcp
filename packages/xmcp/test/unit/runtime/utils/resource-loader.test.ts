import { describe, it, expect } from "vitest";
import { loadResourceModules } from "@/runtime/utils/resource-loader";

const empty = () => Promise.resolve({});
const onlyMetadata = () =>
  Promise.resolve({
    metadata: { name: "x", description: "x" },
  });
const validHandler = () =>
  Promise.resolve({
    default: () => "resource-content",
    metadata: { name: "valid", description: "valid" },
  });
const nonFunctionDefault = () =>
  Promise.resolve({
    default: 42,
    metadata: { name: "bad", description: "bad" },
  });

describe("loadResourceModules", () => {
  it("loads valid resource modules", async () => {
    const { resourceModules, skippedResources } = await loadResourceModules({
      "src/resources/valid.ts": validHandler,
    });

    expect(skippedResources).toEqual([]);
    expect(resourceModules.size).toBe(1);
  });

  it("skips empty resource files", async () => {
    const { resourceModules, skippedResources } = await loadResourceModules({
      "src/resources/empty.ts": empty,
    });

    expect(resourceModules.size).toBe(0);
    expect(skippedResources).toHaveLength(1);
    expect(skippedResources[0]?.message).toMatch(/empty/i);
  });

  it("skips files without a default export", async () => {
    const { resourceModules, skippedResources } = await loadResourceModules({
      "src/resources/no-default.ts": onlyMetadata,
    });

    expect(resourceModules.size).toBe(0);
    expect(skippedResources).toHaveLength(1);
    expect(skippedResources[0]?.message).toMatch(/default/i);
  });

  it("rejects non-function default exports", async () => {
    await expect(
      loadResourceModules({
        "src/resources/bad.ts": nonFunctionDefault,
      })
    ).rejects.toThrow(/src\/resources\/bad\.ts/);
  });
});
