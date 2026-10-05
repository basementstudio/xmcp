import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "multi-message-prompts",
    "round-trips few-shot message arrays and full prompt results",
    async ({ client }) => {
      for (const format of ["array", "result"]) {
        const result = await client.getPrompt(
          { name: "few-shot", arguments: { text: "It is fine", format } },
          REQUEST_OPTIONS
        );
        assert.deepEqual(result.messages, [
          {
            role: "user",
            content: {
              type: "text",
              text: "Classify: I love it",
              _meta: { example: true },
            },
          },
          { role: "assistant", content: { type: "text", text: "positive" } },
          {
            role: "user",
            content: { type: "text", text: "Classify: I dislike it" },
          },
          { role: "assistant", content: { type: "text", text: "negative" } },
          {
            role: "user",
            content: { type: "text", text: "Classify: It is fine" },
          },
        ]);
        assert.equal(
          result.description,
          format === "result" ? "Few-shot sentiment classification" : undefined
        );
        assert.equal(
          result._meta?.source,
          format === "result" ? "few-shot" : undefined
        );
      }
    }
  );
}
