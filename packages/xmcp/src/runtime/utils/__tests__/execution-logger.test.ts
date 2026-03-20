import assert from "node:assert";
import { describe, it } from "node:test";
import {
  withExecutionLogging,
  type ExecutionLogConfig,
} from "../execution-logger";

describe("withExecutionLogging", () => {
  it("should not emit logs when disabled", async () => {
    const writes: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      const result = await withExecutionLogging(
        {
          kind: "tool",
          name: "greet",
          input: { name: "Ada" },
          handler: async () => "ok",
        },
        {
          enabled: false,
          includeInput: true,
        }
      );

      assert.equal(result, "ok");
      assert.deepEqual(writes, []);
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  it("should emit start and success logs when enabled", async () => {
    const writes: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      const config: ExecutionLogConfig = {
        enabled: true,
        includeInput: true,
      };

      await withExecutionLogging(
        {
          kind: "tool",
          name: "greet",
          input: { name: "Ada" },
          handler: async () => "ok",
        },
        config
      );

      assert.equal(writes.length, 2);

      const startLog = JSON.parse(writes[0]);
      const finishLog = JSON.parse(writes[1]);

      assert.equal(startLog.event, "execution.start");
      assert.equal(startLog.kind, "tool");
      assert.equal(startLog.name, "greet");
      assert.deepEqual(startLog.input, { name: "Ada" });

      assert.equal(finishLog.event, "execution.end");
      assert.equal(finishLog.success, true);
      assert.equal(typeof finishLog.durationMs, "number");
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  it("should emit failure logs with an error message", async () => {
    const writes: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    try {
      await assert.rejects(
        withExecutionLogging(
          {
            kind: "resource",
            name: "profile",
            input: { uri: "users://1/profile" },
            handler: async () => {
              throw new Error("boom");
            },
          },
          {
            enabled: true,
            includeInput: false,
          }
        ),
        /boom/
      );

      assert.equal(writes.length, 2);

      const startLog = JSON.parse(writes[0]);
      const finishLog = JSON.parse(writes[1]);

      assert.equal(startLog.input, undefined);
      assert.equal(finishLog.success, false);
      assert.equal(finishLog.error, "boom");
    } finally {
      process.stderr.write = originalWrite;
    }
  });

  it("should not crash when input contains circular references", async () => {
    const writes: string[] = [];
    const originalWrite = process.stderr.write.bind(process.stderr);
    process.stderr.write = ((chunk: any) => {
      writes.push(String(chunk));
      return true;
    }) as typeof process.stderr.write;

    const input: Record<string, unknown> = { name: "Ada" };
    input.self = input;

    try {
      await withExecutionLogging(
        {
          kind: "tool",
          name: "circular",
          input,
          handler: async () => "ok",
        },
        {
          enabled: true,
          includeInput: true,
        }
      );

      assert.equal(writes.length, 2);
      const startLog = JSON.parse(writes[0]);
      assert.equal(startLog.input.self, "[Circular]");
    } finally {
      process.stderr.write = originalWrite;
    }
  });
});
