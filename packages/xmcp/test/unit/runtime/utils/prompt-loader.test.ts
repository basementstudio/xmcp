import { describe, it, expect } from "vitest";
import { loadPromptModules } from "@/runtime/utils/prompt-loader";

const empty = () => Promise.resolve({});
const onlyMetadata = () =>
  Promise.resolve({
    metadata: { name: "x", title: "x", description: "x" },
  });
const validHandler = () =>
  Promise.resolve({
    default: () => "prompt-text",
    metadata: { name: "valid", title: "valid", description: "valid" },
  });
const nonFunctionDefault = () =>
  Promise.resolve({
    default: { not: "a function" },
    metadata: { name: "bad", title: "bad", description: "bad" },
  });

describe("loadPromptModules", () => {
  it("loads valid prompt modules", async () => {
    const { promptModules, skippedPrompts } = await loadPromptModules({
      "src/prompts/valid.ts": validHandler,
    });

    expect(skippedPrompts).toEqual([]);
    expect(promptModules.size).toBe(1);
  });

  it("skips empty prompt files", async () => {
    const { promptModules, skippedPrompts } = await loadPromptModules({
      "src/prompts/empty.ts": empty,
    });

    expect(promptModules.size).toBe(0);
    expect(skippedPrompts).toHaveLength(1);
    expect(skippedPrompts[0]?.message).toMatch(/empty/i);
  });

  it("skips files without a default export", async () => {
    const { promptModules, skippedPrompts } = await loadPromptModules({
      "src/prompts/no-default.ts": onlyMetadata,
    });

    expect(promptModules.size).toBe(0);
    expect(skippedPrompts).toHaveLength(1);
    expect(skippedPrompts[0]?.message).toMatch(/default/i);
  });

  it("rejects non-function default exports", async () => {
    await expect(
      loadPromptModules({
        "src/prompts/bad.ts": nonFunctionDefault,
      })
    ).rejects.toThrow(/src\/prompts\/bad\.ts/);
  });
});
