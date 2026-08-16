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

function makeServer(sentMessages: LogMessage[]) {
  return {
    sendLoggingMessage: (
      message: { level: string; logger?: string; data: unknown },
      messageSessionId?: string
    ) => {
      sentMessages.push({ ...message, sessionId: messageSessionId });
    },
  };
}

test("logging/setLevel persists across two stateless requests on the same session", async () => {
  const transport = new StatelessHttpServerTransport(false, "10mb");
  const sessionId = "logger-persistence-session";
  const sentMessages: LogMessage[] = [];

  // First request: client sets the level to "error".
  (transport as any).captureLogLevelFromPayload(
    { headers: { "mcp-session-id": sessionId } },
    {
      jsonrpc: "2.0",
      method: "logging/setLevel",
      params: { level: "error" },
    }
  );

  // Second request: tool emits info + error. Only error should pass.
  await loggerContextProvider(
    { server: makeServer(sentMessages) as any, sessionId },
    async () => {
      logger.info("info should be filtered", "test-logger");
      logger.error("error should be emitted", "test-logger");
    }
  );

  // Third request (separate handler invocation, same session): same filter
  // must still apply — this is the "persistence" the test name implies.
  await loggerContextProvider(
    { server: makeServer(sentMessages) as any, sessionId },
    async () => {
      logger.notice("notice should still be filtered", "test-logger");
      logger.critical("critical should be emitted", "test-logger");
    }
  );

  assert.deepStrictEqual(sentMessages, [
    {
      level: "error",
      logger: "test-logger",
      data: "error should be emitted",
      sessionId,
    },
    {
      level: "critical",
      logger: "test-logger",
      data: "critical should be emitted",
      sessionId,
    },
  ]);
});

test("a fresh session id is unaffected by a sibling session's level", async () => {
  const transport = new StatelessHttpServerTransport(false, "10mb");
  const noisySession = "noisy-session";
  const quietSession = "quiet-session";
  const sentMessages: LogMessage[] = [];

  (transport as any).captureLogLevelFromPayload(
    { headers: { "mcp-session-id": quietSession } },
    {
      jsonrpc: "2.0",
      method: "logging/setLevel",
      params: { level: "warning" },
    }
  );

  await loggerContextProvider(
    { server: makeServer(sentMessages) as any, sessionId: noisySession },
    async () => {
      logger.notice("notice from noisy session should pass", "noisy");
    }
  );

  await loggerContextProvider(
    { server: makeServer(sentMessages) as any, sessionId: quietSession },
    async () => {
      logger.notice("notice from quiet session should be filtered", "quiet");
      logger.warning("warning from quiet session should pass", "quiet");
    }
  );

  assert.deepStrictEqual(sentMessages, [
    {
      level: "notice",
      logger: "noisy",
      data: "notice from noisy session should pass",
      sessionId: noisySession,
    },
    {
      level: "warning",
      logger: "quiet",
      data: "warning from quiet session should pass",
      sessionId: quietSession,
    },
  ]);
});

test("logger is a safe no-op outside xmcp handler context", () => {
  assert.doesNotThrow(() => {
    logger.info("outside-context", "test-logger");
  });
});
