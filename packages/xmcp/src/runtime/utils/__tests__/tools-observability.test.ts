import assert from "node:assert";
import { describe, it } from "node:test";
import { addToolsToServer } from "../tools";
import { ToolFile } from "../server";

describe("tool observability integration", () => {
  it("should mark isError tool results as failed and log to stderr", async () => {
    (globalThis as { OBSERVABILITY_CONFIG?: { enabled: boolean; includeInput: boolean } }).OBSERVABILITY_CONFIG =
      {
        enabled: true,
        includeInput: true,
      };

    let registeredHandler:
      | ((args: Record<string, unknown>, extra: unknown) => Promise<unknown>)
      | undefined;

    const server = {
      registerTool: (
        _name: string,
        _config: unknown,
        handler: (args: Record<string, unknown>, extra: unknown) => Promise<unknown>
      ) => {
        registeredHandler = handler;
      },
    };

    const toolModule: ToolFile = {
      metadata: {
        name: "failing-tool",
        description: "Returns isError",
      },
      schema: {},
      default: async () => ({
        isError: true,
        content: [{ type: "text", text: "tool failed gracefully" }],
      }),
    };

    addToolsToServer(server as any, new Map([["src/tools/failing-tool.ts", toolModule]]));

    assert.notEqual(registeredHandler, undefined);

    const writes: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      const result = (await registeredHandler!(
        { id: 123 },
        {}
      )) as { isError?: boolean };

      assert.equal(result.isError, true);
      assert.equal(writes.length, 2);

      const startLog = JSON.parse(writes[0]);
      const endLog = JSON.parse(writes[1]);

      assert.equal(startLog.event, "execution.start");
      assert.deepEqual(startLog.input, { id: 123 });
      assert.equal(endLog.event, "execution.end");
      assert.equal(endLog.success, false);
      assert.equal(endLog.error, "tool failed gracefully");
    } finally {
      process.stderr.write = originalWrite;
      delete (globalThis as { OBSERVABILITY_CONFIG?: unknown }).OBSERVABILITY_CONFIG;
    }
  });
});
