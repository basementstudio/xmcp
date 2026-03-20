import assert from "node:assert";
import { describe, it } from "node:test";
import {
  EMPTY_TOOL_FILE_MESSAGE,
  MISSING_DEFAULT_EXPORT_MESSAGE,
  createToolLoadIssueReporter,
  loadToolModules,
} from "../tool-loader";

describe("loadToolModules", () => {
  it("skips empty modules and missing default exports while keeping valid tools", async () => {
    const { toolModules, skippedTools } = await loadToolModules({
      "src/tools/valid.ts": async () => ({
        default: async () => ({ content: [] }),
        metadata: {
          name: "valid",
          description: "A valid tool",
        },
        schema: {},
      }),
      "src/tools/empty.ts": async () => ({}),
      "src/tools/missing-default.ts": async () => ({
        metadata: {
          name: "missing-default",
        },
      }),
    });

    assert.equal(toolModules.size, 1);
    assert.equal(toolModules.has("src/tools/valid.ts"), true);
    assert.deepEqual(skippedTools, [
      {
        path: "src/tools/empty.ts",
        message: EMPTY_TOOL_FILE_MESSAGE,
      },
      {
        path: "src/tools/missing-default.ts",
        message: MISSING_DEFAULT_EXPORT_MESSAGE,
      },
    ]);
  });

  it("does not silently ignore invalid default exports", async () => {
    await assert.rejects(
      loadToolModules({
        "src/tools/not-a-handler.ts": async () => ({
          default: "nope",
        }),
      }),
      /\[xmcp\] Invalid tool file: src\/tools\/not-a-handler\.ts[\s\S]*Default export must be a tool handler function\./
    );
  });

  it("preserves thrown import errors", async () => {
    const syntaxError = new SyntaxError("Unexpected token");

    await assert.rejects(
      loadToolModules({
        "src/tools/broken.ts": async () => {
          throw syntaxError;
        },
      }),
      syntaxError
    );
  });
});

describe("createToolLoadIssueReporter", () => {
  it("logs each skipped tool once per unchanged startup state with the specific reason", () => {
    const warnings: string[] = [];
    const report = createToolLoadIssueReporter({
      warn: (message: string) => {
        warnings.push(message);
      },
    });

    const skippedTools = [
      {
        path: "src/tools/empty.ts",
        message: EMPTY_TOOL_FILE_MESSAGE,
      },
      {
        path: "src/tools/missing-default.ts",
        message: MISSING_DEFAULT_EXPORT_MESSAGE,
      },
    ];

    report(skippedTools);
    report(skippedTools);

    assert.deepEqual(warnings, [
      `[xmcp] Failed to load tool file: src/tools/empty.ts\n   -> ${EMPTY_TOOL_FILE_MESSAGE}`,
      `[xmcp] Failed to load tool file: src/tools/missing-default.ts\n   -> ${MISSING_DEFAULT_EXPORT_MESSAGE}`,
      "[xmcp] 2 tools skipped due to empty files or missing default exports",
    ]);
  });

  it("logs again after the skipped tool state clears and returns", () => {
    const warnings: string[] = [];
    const report = createToolLoadIssueReporter({
      warn: (message: string) => {
        warnings.push(message);
      },
    });

    const skippedTools = [
      {
        path: "src/tools/empty.ts",
        message: EMPTY_TOOL_FILE_MESSAGE,
      },
    ];

    report(skippedTools);
    report([]);
    report(skippedTools);

    assert.deepEqual(warnings, [
      `[xmcp] Failed to load tool file: src/tools/empty.ts\n   -> ${EMPTY_TOOL_FILE_MESSAGE}`,
      "[xmcp] 1 tool skipped due to empty files or missing default exports",
      `[xmcp] Failed to load tool file: src/tools/empty.ts\n   -> ${EMPTY_TOOL_FILE_MESSAGE}`,
      "[xmcp] 1 tool skipped due to empty files or missing default exports",
    ]);
  });
});
