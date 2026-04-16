import { test } from "node:test";
import assert from "node:assert";
import { logger, loggerContextProvider } from "../logger";
import { StatelessHttpServerTransport } from "../../transports/http/stateless-streamable-http";

type LogMessage = {
  level: string;
  logger?: string;
  data: unknown;
  sessionId?: string;
};

test("logging/setLevel persists for later requests on the same session", async () => {
  const transport = new StatelessHttpServerTransport(false, "10mb");
  const sessionId = "logger-persistence-session";
  const sentMessages: LogMessage[] = [];

  (transport as any).captureLogLevelFromPayload(
    {
      headers: {
        "mcp-session-id": sessionId,
      },
    },
    {
      jsonrpc: "2.0",
      method: "logging/setLevel",
      params: {
        level: "error",
      },
    }
  );

  await loggerContextProvider(
    {
      server: {
        sendLoggingMessage: (
          message: { level: string; logger?: string; data: unknown },
          messageSessionId?: string
        ) => {
          sentMessages.push({ ...message, sessionId: messageSessionId });
        },
      } as any,
      sessionId,
    },
    async () => {
      logger.info("info should be filtered", "test-logger");
      logger.error("error should be emitted", "test-logger");
    }
  );

  assert.deepStrictEqual(sentMessages, [
    {
      level: "error",
      logger: "test-logger",
      data: "error should be emitted",
      sessionId,
    },
  ]);
});

test("logger is a safe no-op outside xmcp handler context", () => {
  assert.doesNotThrow(() => {
    logger.info("outside-context", "test-logger");
  });
});
