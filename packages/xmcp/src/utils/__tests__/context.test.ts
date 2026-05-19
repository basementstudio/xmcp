import { test } from "node:test";
import assert from "node:assert";
import { createContext } from "../context";

test("createContext clears fallback state after async provider resolves", async () => {
  const context = createContext<{ value: string }>({
    name: "async-cleanup-test",
  });

  const result = await context.provider({ value: "inside" }, async () => {
    await Promise.resolve();
    return context.getContext().value;
  });

  assert.strictEqual(result, "inside");
  assert.throws(() => context.getContext(), /async-cleanup-test context/);
});
