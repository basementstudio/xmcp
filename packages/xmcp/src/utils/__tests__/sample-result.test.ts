import assert from "node:assert";
import { describe, it } from "node:test";
import type { SampleResult } from "../../types/tool";
import {
  getSampleContentBlocks,
  getSampleTextContent,
} from "../sample-result";

describe("sample result helpers", () => {
  it("normalizes a single content block into an array", () => {
    const result = {
      model: "mock-model",
      role: "assistant",
      stopReason: "endTurn",
      content: {
        type: "text",
        text: "Single block",
      },
    } as SampleResult;

    assert.deepStrictEqual(getSampleContentBlocks(result), [result.content]);
    assert.equal(getSampleTextContent(result), "Single block");
  });

  it("collects text blocks from tool-enabled sampling responses", () => {
    const result = {
      model: "mock-model",
      role: "assistant",
      stopReason: "toolUse",
      content: [
        {
          type: "text",
          text: "First block",
        },
        {
          type: "tool_use",
          id: "tool-1",
          name: "search_docs",
          input: {
            query: "xmcp",
          },
        },
        {
          type: "text",
          text: "Second block",
        },
      ],
    } as SampleResult;

    assert.equal(getSampleTextContent(result), "First block\nSecond block");
  });
});
