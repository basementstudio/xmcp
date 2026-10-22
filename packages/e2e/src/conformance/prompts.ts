import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported("prompts", "lists and renders prompts", async ({ client }) => {
    const { prompts } = await client.listPrompts({}, REQUEST_OPTIONS);
    assert.ok(prompts.some((prompt) => prompt.name === "greet"));
    const result = await client.getPrompt(
      { name: "greet", arguments: { name: "Ada" } },
      REQUEST_OPTIONS
    );
    assert.deepEqual(result.messages, [
      { role: "user", content: { type: "text", text: "Hello, Ada" } },
    ]);
  });
}
