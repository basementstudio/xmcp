import { describe, it, expect } from "vitest";
import { loadToolModules } from "@/runtime/utils/tool-loader";

const empty = () => Promise.resolve({});
const onlyMetadata = () =>
  Promise.resolve({
    metadata: { name: "x", description: "x" },
    schema: {},
  });
const validHandler = () =>
  Promise.resolve({
    default: () => "hi",
    metadata: { name: "valid", description: "valid" },
    schema: {},
  });
const nonFunctionDefault = () =>
  Promise.resolve({
    default: "not a function",
    metadata: { name: "bad", description: "bad" },
  });

describe("loadToolModules", () => {
  it("loads valid tool modules", async () => {
    const { toolModules, skippedTools } = await loadToolModules({
      "src/tools/valid.ts": validHandler,
    });

    expect(skippedTools).toEqual([]);
    expect(toolModules.size).toBe(1);
    expect(toolModules.get("src/tools/valid.ts")).toBeDefined();
  });

  it("skips empty tool files with a structured issue (regression for bug #528)", async () => {
    const { toolModules, skippedTools } = await loadToolModules({
      "src/tools/empty.ts": empty,
    });

    expect(toolModules.size).toBe(0);
    expect(skippedTools).toHaveLength(1);
    expect(skippedTools[0]).toMatchObject({
      path: "src/tools/empty.ts",
      message: expect.stringContaining("empty"),
    });
  });

  it("skips files exporting only metadata (no default handler)", async () => {
    const { toolModules, skippedTools } = await loadToolModules({
      "src/tools/no-default.ts": onlyMetadata,
    });

    expect(toolModules.size).toBe(0);
    expect(skippedTools).toHaveLength(1);
    expect(skippedTools[0]?.path).toBe("src/tools/no-default.ts");
    expect(skippedTools[0]?.message).toMatch(/default/i);
  });

  it("rejects non-function default exports with a useful error naming the path", async () => {
    await expect(
      loadToolModules({
        "src/tools/bad-default.ts": nonFunctionDefault,
      })
    ).rejects.toThrow(/src\/tools\/bad-default\.ts/);
  });

  it("processes a mix of valid, empty, and missing-default in one batch", async () => {
    const { toolModules, skippedTools } = await loadToolModules({
      "src/tools/valid.ts": validHandler,
      "src/tools/empty.ts": empty,
      "src/tools/no-default.ts": onlyMetadata,
    });

    expect(toolModules.size).toBe(1);
    expect(toolModules.has("src/tools/valid.ts")).toBe(true);
    expect(skippedTools).toHaveLength(2);
    const paths = skippedTools.map((s) => s.path).sort();
    expect(paths).toEqual(["src/tools/empty.ts", "src/tools/no-default.ts"]);
  });
});
