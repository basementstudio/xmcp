import assert from "node:assert/strict";
import { CLIENT_INFO, REQUEST_OPTIONS } from "../harness/client-options.js";
import {
  createConformanceChecks,
  type GetTarget,
} from "../harness/conformance.js";

export function register(getTarget: GetTarget, onFailure?: () => void) {
  const whenSupported = createConformanceChecks(getTarget, onFailure);
  whenSupported(
    "tools",
    "lists tools with input/output schemas and annotations",
    async ({ client }) => {
      const { tools } = await client.listTools({}, REQUEST_OPTIONS);
      const add = tools.find((tool) => tool.name === "add");
      assert.ok(add);
      assert.deepEqual(add.inputSchema.required, ["a", "b"]);
      assert.partialDeepStrictEqual(add.inputSchema.properties?.a, {
        type: "number",
      });
      assert.ok(add.outputSchema);
      assert.partialDeepStrictEqual(add.outputSchema.properties, {
        sum: { type: "number" },
      });
      assert.equal(add.annotations?.readOnlyHint, true);
      assert.ok(tools.some((tool) => tool.name === "confirm"));
    }
  );
  whenSupported(
    "tools",
    "calls a tool and preserves structured output",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "add", arguments: { a: 2, b: 3 } },
        REQUEST_OPTIONS
      );
      assert.notEqual(result.isError, true);
      assert.deepEqual(result.structuredContent, { sum: 5 });
    }
  );
  whenSupported(
    "tools",
    "rejects invalid arguments and unknown tools",
    async ({ client }) => {
      // Servers may return a tool error or a JSON-RPC error. A successful result
      // in either case is a regression; transport failures are not accepted.
      for (const params of [
        { name: "add", arguments: { a: "invalid", b: 3 } },
        { name: "missing-tool", arguments: {} },
      ]) {
        const outcome = await client.callTool(params, REQUEST_OPTIONS).then(
          (result) => ({ result }),
          (error: unknown) => ({ error })
        );
        if ("result" in outcome) assert.equal(outcome.result.isError, true);
        else {
          assert.ok(outcome.error instanceof Error);
          assert.ok("code" in outcome.error);
          assert.ok(
            [-32602, -32601].includes(Number(outcome.error.code)),
            outcome.error.message
          );
        }
      }
    }
  );
  whenSupported("tools", "preserves application errors", async ({ client }) => {
    const result = await client.callTool(
      { name: "fail", arguments: {} },
      REQUEST_OPTIONS
    );
    assert.equal(result.isError, true);
    assert.deepEqual(result.content, [
      { type: "text", text: "Expected fixture error" },
    ]);
  });
  whenSupported(
    "tools",
    "exposes client identity to tools",
    async ({ client }) => {
      const result = await client.callTool(
        { name: "client-info", arguments: {} },
        REQUEST_OPTIONS
      );
      assert.deepEqual(result.structuredContent, { clientInfo: CLIENT_INFO });
    }
  );
}
