import { test } from "node:test";
import assert from "node:assert";
import { logger, loggerContextProvider } from "../logger";

type LogMessage = {
  level: string;
  logger?: string;
  data: unknown;
  sessionId?: string;
};

function makeServer(sentMessages: LogMessage[]) {
  return {
    sendLoggingMessage: (
      message: { level: string; logger?: string; data: unknown },
      messageSessionId?: string
    ) => {
      // Mirror the SDK's serialization step so unserialisable values throw
      // exactly as they would in production.
      JSON.stringify(message.data);
      sentMessages.push({ ...message, sessionId: messageSessionId });
    },
  };
}

function captureStderr(): {
  output: string[];
  restore: () => void;
} {
  const original = process.stderr.write.bind(process.stderr);
  const output: string[] = [];
  process.stderr.write = ((chunk: any) => {
    output.push(typeof chunk === "string" ? chunk : chunk.toString());
    return true;
  }) as typeof process.stderr.write;
  return {
    output,
    restore: () => {
      process.stderr.write = original;
    },
  };
}

function withNodeEnv<T>(value: string | undefined, fn: () => T): T {
  const previous = process.env.NODE_ENV;
  if (value === undefined) {
    delete process.env.NODE_ENV;
  } else {
    process.env.NODE_ENV = value;
  }
  try {
    return fn();
  } finally {
    if (previous === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previous;
    }
  }
}

test("logger.info(undefined) is a no-op", async () => {
  const sentMessages: LogMessage[] = [];

  await loggerContextProvider(
    { server: makeServer(sentMessages) as any, sessionId: "s1" },
    async () => {
      logger.info(undefined, "test");
    }
  );

  assert.deepStrictEqual(sentMessages, []);
});

test("circular data emits an stderr diagnostic in development", async () => {
  const sentMessages: LogMessage[] = [];
  const stderr = captureStderr();
  const circular: Record<string, unknown> = { name: "loop" };
  circular.self = circular;

  try {
    await withNodeEnv("development", async () => {
      await loggerContextProvider(
        { server: makeServer(sentMessages) as any, sessionId: "s1" },
        async () => {
          logger.error(circular, "broken");
        }
      );
    });
  } finally {
    stderr.restore();
  }

  assert.deepStrictEqual(sentMessages, []);
  assert.strictEqual(stderr.output.length, 1);
  assert.match(
    stderr.output[0],
    /\[xmcp logger\] dropped error message from broken:/
  );
});

test("circular data is silent in production", async () => {
  const sentMessages: LogMessage[] = [];
  const stderr = captureStderr();
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  try {
    await withNodeEnv("production", async () => {
      await loggerContextProvider(
        { server: makeServer(sentMessages) as any, sessionId: "s1" },
        async () => {
          logger.error(circular, "broken");
        }
      );
    });
  } finally {
    stderr.restore();
  }

  assert.deepStrictEqual(sentMessages, []);
  assert.deepStrictEqual(stderr.output, []);
});

test("BigInt data emits an stderr diagnostic in development", async () => {
  const sentMessages: LogMessage[] = [];
  const stderr = captureStderr();

  try {
    await withNodeEnv("development", async () => {
      await loggerContextProvider(
        { server: makeServer(sentMessages) as any, sessionId: "s1" },
        async () => {
          logger.warning(BigInt(42), "math");
        }
      );
    });
  } finally {
    stderr.restore();
  }

  assert.deepStrictEqual(sentMessages, []);
  assert.strictEqual(stderr.output.length, 1);
  assert.match(
    stderr.output[0],
    /\[xmcp logger\] dropped warning message from math:/
  );
});

test("anonymous logger name renders as <anonymous>", async () => {
  const sentMessages: LogMessage[] = [];
  const stderr = captureStderr();
  const circular: Record<string, unknown> = {};
  circular.self = circular;

  try {
    await withNodeEnv("development", async () => {
      await loggerContextProvider(
        { server: makeServer(sentMessages) as any, sessionId: "s1" },
        async () => {
          logger.error(circular);
        }
      );
    });
  } finally {
    stderr.restore();
  }

  assert.match(stderr.output[0], /from <anonymous>:/);
});
