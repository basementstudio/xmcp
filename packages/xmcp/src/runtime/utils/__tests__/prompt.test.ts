import test from "node:test";
import assert from "node:assert/strict";
import type {
  GetPromptResult,
  PromptMessage,
  ServerContext,
} from "@modelcontextprotocol/server";
import {
  transformPromptHandler,
  type PromptContent,
  type UserPromptHandler,
} from "../transformers/prompt";

const context = {} as ServerContext;
const messages: PromptMessage[] = [
  { role: "user", content: { type: "text", text: "Say hello" } },
  { role: "assistant", content: { type: "text", text: "Hello!" } },
  { role: "user", content: { type: "text", text: "Say goodbye" } },
];

test("single prompt values keep the default and configured roles", async () => {
  const content: PromptContent = {
    type: "text",
    text: "Hello",
    _meta: { source: "fixture" },
  };
  for (const value of ["Hello", 0, content]) {
    for (const role of [undefined, "user", "assistant"] as const) {
      const result = await transformPromptHandler(() => value, role)(
        {},
        context
      );
      assert.deepEqual(result, {
        messages: [
          {
            role: role ?? "assistant",
            content:
              typeof value === "object"
                ? value
                : { type: "text", text: String(value) },
          },
        ],
      });
    }
  }
});

test("message arrays preserve order and explicit roles for sync and async handlers", async () => {
  const expected = structuredClone(messages);
  for (const handler of [() => messages, async () => messages]) {
    for (const role of [undefined, "user", "assistant"] as const) {
      const result = await transformPromptHandler(handler, role)({}, context);
      assert.strictEqual(result.messages, messages);
      assert.deepEqual(result.messages, expected);
    }
  }
});

test("full results preserve description, metadata, and extension fields", async () => {
  const value: GetPromptResult = {
    description: "A few-shot conversation",
    messages,
    _meta: { source: "fixture" },
    extension: { keep: true },
  };
  const expected = structuredClone(value);
  for (const handler of [() => value, async () => value]) {
    const result = await transformPromptHandler(handler)({}, context);
    assert.strictEqual(result, value);
    assert.deepEqual(result, expected);
  }
});

test("multi-message results support all prompt content types", async () => {
  const contents: PromptContent[] = [
    { type: "text", text: "Look and listen", _meta: { source: "fixture" } },
    { type: "image", data: "aGk=", mimeType: "image/png" },
    { type: "audio", data: "aGk=", mimeType: "audio/wav" },
    { type: "resource_link", name: "Guide", uri: "guide://intro" },
    {
      type: "resource",
      resource: {
        uri: "guide://text",
        text: "A guide",
        mimeType: "text/plain",
      },
    },
    {
      type: "resource",
      resource: { uri: "guide://blob", blob: "aGk=", mimeType: "text/plain" },
    },
  ];
  const value: PromptMessage[] = contents.map((content) => ({
    role: "user",
    content,
  }));
  assert.deepEqual(await transformPromptHandler(() => value)({}, context), {
    messages: value,
  });
});

test("empty message arrays and full results are valid", async () => {
  for (const value of [[], { messages: [] }]) {
    assert.deepEqual(await transformPromptHandler(() => value)({}, context), {
      messages: [],
    });
  }
});

test("prompt handlers receive their arguments and context unchanged", async () => {
  const args = {};
  await transformPromptHandler((receivedArgs, receivedContext) => {
    assert.strictEqual(receivedArgs, args);
    assert.strictEqual(receivedContext, context);
    return messages;
  })(args, context);
});

test("invalid messages identify the failing position and field", async () => {
  const invalidMessages = [
    null,
    "text",
    {},
    { role: "system", content: { type: "text", text: "wrong role" } },
    { role: "user", content: "plain text" },
    { role: "user", content: { type: "text", text: 42 } },
    { role: "user", content: { type: "image", data: "aGk=" } },
    { role: "user", content: { type: "audio", mimeType: "audio/wav" } },
    { role: "user", content: { type: "resource", resource: { uri: "x://y" } } },
    { role: "user", content: { type: "resource_link", uri: "x://y" } },
    { role: "user", content: { type: "unknown" } },
    { role: "user", content: { type: "text", text: "hi", _meta: null } },
  ];
  for (const message of invalidMessages) {
    for (const value of [
      [messages[0], message],
      { messages: [messages[0], message] },
    ]) {
      await assert.rejects(
        async () =>
          transformPromptHandler((() => value) as unknown as UserPromptHandler)(
            {},
            context
          ),
        /Invalid prompt result: messages\.1/
      );
    }
  }
});

test("invalid result fields and unsupported return values fail clearly", async () => {
  for (const [value, error] of [
    [{ messages: "wrong" }, /Invalid prompt result: messages/],
    [{ messages: null }, /Invalid prompt result: messages/],
    [{ messages, description: 42 }, /Invalid prompt result: description/],
    [{ messages, _meta: null }, /Invalid prompt result: _meta/],
    [undefined, /Prompt handler must return/],
    [null, /Prompt handler must return/],
    [true, /Prompt handler must return/],
    [{}, /Prompt handler must return/],
    [{ type: "text", text: 42 }, /Text content must have/],
  ] as const) {
    await assert.rejects(
      async () =>
        transformPromptHandler((() => value) as unknown as UserPromptHandler)(
          {},
          context
        ),
      error
    );
  }
});

test("invalid single-message metadata roles still fail", async () => {
  await assert.rejects(
    async () =>
      transformPromptHandler(() => "Hello", "system" as "user")({}, context),
    /Invalid role: system/
  );
});
