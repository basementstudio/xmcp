import assert from "node:assert/strict";
import { afterEach, beforeEach, mock, test } from "node:test";
import { z } from "zod";
import middleware from "../src/middleware";
import ask, { schema } from "../src/tools/ask-grok";
import searchWeb from "../src/tools/search-web-with-grok";
import searchX from "../src/tools/search-x-with-grok";
const originalEnv = { ...process.env };
const input = z.object(schema).parse({ prompt: "Explain MCP" });
const output = {
  id: "response-id",
  model: "grok-4.7",
  status: "completed",
  output: [
    {
      type: "message",
      role: "assistant",
      content: [{ type: "output_text", text: "An answer", annotations: [] }],
    },
  ],
};
beforeEach(() => {
  process.env.XAI_API_KEY = "test-provider-key";
  delete process.env.XAI_MODEL;
  mock.method(globalThis, "fetch", async () => {
    throw new Error("Unexpected request");
  });
});
afterEach(() => {
  mock.restoreAll();
  process.env = { ...originalEnv };
});

test("answers use Responses API with no stored conversation or search", async () => {
  mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.x.ai/v1/responses");
    assert.equal(init.method, "POST");
    assert.equal(init.redirect, "error");
    assert.ok(init.signal);
    assert.equal(
      new Headers(init.headers).get("Authorization"),
      "Bearer test-provider-key"
    );
    assert.equal(new Headers(init.headers).get("x-api-key"), null);
    assert.deepEqual(JSON.parse(init.body as string), {
      model: "grok-4.7",
      input: [{ role: "user", content: "Explain MCP" }],
      store: false,
      stream: false,
      max_output_tokens: 1024,
    });
    return Response.json(output);
  });
  assert.deepEqual(JSON.parse((await ask(input)).content[0].text), {
    responseId: "response-id",
    model: "grok-4.7",
    text: "An answer",
    citations: [],
  });
});

test("web and X search require their respective provider tool and limit turns", async () => {
  for (const [tool, type] of [
    [searchWeb, "web_search"],
    [searchX, "x_search"],
  ] as const) {
    process.env.XAI_MODEL = " selected-model ";
    mock.method(
      globalThis,
      "fetch",
      async (_url: string, init: RequestInit) => {
        const body = JSON.parse(init.body as string);
        assert.equal(body.model, "selected-model");
        assert.deepEqual(body.tools, [{ type }]);
        assert.equal(body.tool_choice, "required");
        assert.equal(body.max_turns, 3);
        assert.equal(body.parallel_tool_calls, false);
        assert.equal(body.store, false);
        return Response.json(output);
      }
    );
    assert.equal((await tool(input)).isError, undefined);
  }
});

test("only assistant answer text and safe deduplicated citations are exposed", async () => {
  mock.method(globalThis, "fetch", async () =>
    Response.json({
      ...output,
      output: [
        {
          type: "reasoning",
          content: [{ type: "output_text", text: "private reasoning" }],
        },
        {
          type: "web_search_call",
          action: { query: "private search internals" },
        },
        {
          type: "message",
          role: "assistant",
          content: [
            {
              type: "output_text",
              text: "First",
              annotations: [
                {
                  type: "url_citation",
                  url: "https://example.com",
                  title: "Example",
                  start_index: 0,
                  end_index: 5,
                },
                {
                  type: "url_citation",
                  url: "https://example.com",
                  title: "Example",
                },
                { type: "url_citation", url: "javascript:alert(1)" },
              ],
            },
            { type: "output_text", text: "Second" },
          ],
        },
      ],
    })
  );
  const result = await searchWeb(input);
  assert.deepEqual(JSON.parse(result.content[0].text), {
    responseId: "response-id",
    model: "grok-4.7",
    text: "First\n\nSecond",
    citations: [{ url: "https://example.com", title: "Example" }],
  });
  assert.doesNotMatch(result.content[0].text, /private|javascript/);
});

test("incomplete, errored, malformed, empty, and refused responses never report an answer", async () => {
  for (const value of [
    {},
    { ...output, status: "incomplete" },
    { ...output, error: { message: "secret" } },
    { ...output, output: [] },
    {
      ...output,
      output: [
        {
          type: "message",
          role: "assistant",
          content: [{ type: "refusal", refusal: "secret" }],
        },
      ],
    },
  ]) {
    mock.method(globalThis, "fetch", async () => Response.json(value));
    const result = await ask(input);
    assert.equal(result.isError, true);
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
});

test("provider errors are redacted without retries", async () => {
  let calls = 0;
  for (const status of [401, 403, 429, 500]) {
    mock.method(globalThis, "fetch", async () => {
      calls++;
      return Response.json({ error: { message: "secret" } }, { status });
    });
    const result = await ask(input);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, new RegExp(`HTTP ${status}`));
    assert.doesNotMatch(result.content[0].text, /secret/);
  }
  mock.method(globalThis, "fetch", async () => {
    calls++;
    throw new Error("test-provider-key");
  });
  const result = await ask(input);
  assert.equal(result.isError, true);
  assert.doesNotMatch(result.content[0].text, /test-provider-key/);
  assert.match(result.content[0].text, /billing/);
  assert.equal(calls, 5);
  mock.method(globalThis, "fetch", async () => new Response("not JSON"));
  assert.equal((await ask(input)).isError, true);
});

test("missing credentials fail before fetch and schemas bound prompts and visible tokens", async () => {
  process.env.XAI_API_KEY = " ";
  const request = mock.method(globalThis, "fetch", async () =>
    Response.json(output)
  );
  assert.equal((await ask(input)).isError, true);
  assert.equal(request.mock.callCount(), 0);
  for (const prompt of [" ", "x".repeat(8001)])
    assert.equal(z.object(schema).safeParse({ prompt }).success, false);
  for (const maxOutputTokens of [127, 4097, 128.5])
    assert.equal(
      z.object(schema).safeParse({ prompt: "Hi", maxOutputTokens }).success,
      false
    );
  assert.equal(input.maxOutputTokens, 1024);
});

test("MCP authentication fails closed", async () => {
  for (const [configured, supplied, allowed] of [
    ["test-client-key", "test-client-key", true],
    ["test-client-key", "wrong", false],
    ["test-client-key", undefined, false],
    ["", "anything", false],
    ["   ", "   ", false],
  ] as const) {
    process.env.MCP_API_KEY = configured;
    let executed = false;
    let status: number | undefined;
    const response = {
      status(code: number) {
        status = code;
        return this;
      },
      json() {},
    };
    await middleware(
      { header: () => supplied } as unknown as Parameters<typeof middleware>[0],
      response as unknown as Parameters<typeof middleware>[1],
      () => {
        executed = true;
      }
    );
    assert.equal(executed, allowed);
    assert.equal(status, allowed ? undefined : 401);
  }
});
