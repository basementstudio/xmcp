import assert from "node:assert/strict";
import { REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "mcp-middleware",
    "orders tool middleware and shares isolated values with handlers",
    async ({ client }) => {
      await Promise.all(
        ["first", "second"].map(async (label) => {
          const result = await client.callTool(
            { name: "middleware-echo", arguments: { label } },
            REQUEST_OPTIONS
          );
          assert.notEqual(result.isError, true);
          assert.deepEqual(result.structuredContent, { label });
          // The SDK may also attach protocol metadata to the result envelope.
          assert.deepEqual(
            { trace: result._meta?.trace, label: result._meta?.label },
            {
              trace: [
                "outer before",
                "inner before",
                "tool",
                "inner after",
                "outer after",
              ],
              label,
            }
          );
        })
      );
    }
  );
  whenSupported(
    "mcp-middleware",
    "denies a tool call before the handler runs",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "middleware-denied", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.equal(result.isError, true);
      assert.deepEqual(result.content, [
        { type: "text", text: "Denied by MCP middleware" },
      ]);
    }
  );
  whenSupported(
    "mcp-middleware",
    "returns a short-circuit result without invoking the tool",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "middleware-short-circuit", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.content, [
        { type: "text", text: "short-circuited" },
      ]);
    }
  );
}
