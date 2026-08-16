import { test } from "node:test";
import assert from "node:assert";
import { z } from "zod";
import { logger } from "../logger";
import { addToolsToServer } from "../tools";
import { addPromptsToServer } from "../prompts";
import { addResourcesToServer } from "../resources";

type LoggedMessage = {
  level: string;
  logger?: string;
  data: unknown;
  sessionId?: string;
};

type MinimalToolExtra = {
  sessionId: string;
  signal: AbortSignal;
  requestId: string;
  sendNotification: (notification: unknown) => Promise<void>;
  sendRequest: (request: unknown, resultSchema: unknown) => Promise<unknown>;
};

const createToolExtra = (sessionId: string): MinimalToolExtra => ({
  sessionId,
  signal: new AbortController().signal,
  requestId: "rpc-1",
  sendNotification: async () => undefined,
  sendRequest: async () => ({}),
});

function createServerHarness() {
  const sentMessages: LoggedMessage[] = [];
  let registeredToolHandler: ((args: any, extra: any) => Promise<any>) | undefined;
  let registeredPromptHandler:
    | ((args: any, extra: any) => Promise<any>)
    | undefined;
  let registeredResourceHandler:
    | ((uri: URL, extra: any) => Promise<any>)
    | undefined;

  const server = {
    sendLoggingMessage: (
      message: { level: string; logger?: string; data: unknown },
      sessionId?: string
    ) => {
      sentMessages.push({ ...message, sessionId });
    },
    registerTool: (
      _name: string,
      _config: unknown,
      handler: (args: any, extra: any) => Promise<any>
    ) => {
      registeredToolHandler = handler;
    },
    registerPrompt: (
      _name: string,
      _config: unknown,
      handler: (args: any, extra: any) => Promise<any>
    ) => {
      registeredPromptHandler = handler;
    },
    registerResource: (
      _name: string,
      _resource: unknown,
      _config: unknown,
      handler: (uri: URL, extra: any) => Promise<any>
    ) => {
      registeredResourceHandler = handler;
    },
  };

  return {
    server,
    sentMessages,
    getToolHandler() {
      assert.ok(registeredToolHandler);
      return registeredToolHandler;
    },
    getPromptHandler() {
      assert.ok(registeredPromptHandler);
      return registeredPromptHandler;
    },
    getResourceHandler() {
      assert.ok(registeredResourceHandler);
      return registeredResourceHandler;
    },
  };
}

test("tool handlers get logger context through registration wrappers", async () => {
  const harness = createServerHarness();

  addToolsToServer(
    harness.server as any,
    new Map([
      [
        "src/tools/log.ts",
        {
          metadata: {
            name: "log-tool",
            description: "log tool",
          },
          schema: {
            value: z.string(),
          },
          default: ({ value }: { value: string }) => {
            logger.info(value, "tool-logger");
            return "ok";
          },
        },
      ],
    ])
  );

  await harness.getToolHandler()(
    { value: "tool-message" },
    createToolExtra("tool-session")
  );

  assert.deepStrictEqual(harness.sentMessages, [
    {
      level: "info",
      logger: "tool-logger",
      data: "tool-message",
      sessionId: "tool-session",
    },
  ]);
});

test("prompt handlers get logger context through registration wrappers", async () => {
  const harness = createServerHarness();

  addPromptsToServer(
    harness.server as any,
    new Map([
      [
        "src/prompts/log.ts",
        {
          metadata: {
            name: "log-prompt",
            title: "log-prompt",
            description: "log prompt",
          },
          schema: {},
          default: () => {
            logger.notice("prompt-message", "prompt-logger");
            return "done";
          },
        },
      ],
    ])
  );

  await harness.getPromptHandler()({}, { sessionId: "prompt-session" });

  assert.deepStrictEqual(harness.sentMessages, [
    {
      level: "notice",
      logger: "prompt-logger",
      data: "prompt-message",
      sessionId: "prompt-session",
    },
  ]);
});

test("resource handlers get logger context through registration wrappers", async () => {
  const harness = createServerHarness();

  addResourcesToServer(
    harness.server as any,
    new Map([
      [
        "(resource)/status.ts",
        {
          metadata: {
            name: "status",
            description: "status resource",
          },
          schema: {},
          default: () => {
            logger.debug("resource-message", "resource-logger");
            return "ok";
          },
        },
      ],
    ])
  );

  await harness.getResourceHandler()(
    new URL("resource://status"),
    { sessionId: "resource-session" }
  );

  assert.deepStrictEqual(harness.sentMessages, [
    {
      level: "debug",
      logger: "resource-logger",
      data: "resource-message",
      sessionId: "resource-session",
    },
  ]);
});
