import assert from "node:assert/strict";
import { test } from "node:test";
import { MockLanguageModelV4 } from "ai/test";
import { askAgent } from "../src/agent-client";
import {
  SHIPPING_TOOL,
  shippingClient,
  shippingTools,
} from "../src/connection";
import { decode, rpc, startServer, TEST_TIMEOUT_MS } from "./server";

const KEY = "client-test-key";

const usage = {
  inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 1, text: 1, reasoning: 0 },
};

type CallOptions = MockLanguageModelV4["doGenerateCalls"][number];

/** Calls the shipping tool once, then answers with the tool's text. */
function shippingModel() {
  return new MockLanguageModelV4({
    doGenerate: async (options) => {
      const toolResult = options.prompt
        .flatMap((message) => (message.role === "tool" ? message.content : []))
        .find((part) => part.type === "tool-result");
      return toolResult
        ? {
            content: [
              {
                type: "text",
                text: `Policy: ${JSON.stringify(toolResult.output)}`,
              },
            ],
            finishReason: { unified: "stop", raw: "stop" },
            usage,
            warnings: [],
          }
        : {
            content: [
              {
                type: "tool-call",
                toolCallId: "call-1",
                toolName: SHIPPING_TOOL,
                input: "{}",
              },
            ],
            finishReason: { unified: "tool-calls", raw: "tool_use" },
            usage,
            warnings: [],
          };
    },
  });
}

test(
  "xmcp serves Mastra: auth, discovery, tools, and agent runs",
  { timeout: TEST_TIMEOUT_MS },
  async (context) => {
    const endpoint = await startServer(context, {
      MCP_API_KEY: KEY,
      MASTRA_MODEL: "",
    });
    const send = rpc(endpoint, AbortSignal.timeout(TEST_TIMEOUT_MS));
    const call = async (name: string, args: unknown) =>
      decode(await send("tools/call", { name, arguments: args }, KEY));

    assert.equal((await send("tools/list", {})).status, 401);
    assert.equal((await send("tools/list", {}, "wrong")).status, 401);
    const [allowed, denied] = await Promise.all([
      send("tools/list", {}, KEY),
      send("tools/list", {}, "wrong"),
    ]);
    assert.equal(denied.status, 401);
    const names = (await decode(allowed)).result.tools.map(
      (tool: { name: string }) => tool.name
    );
    assert.deepEqual(names.sort(), ["ask-agent", "get-shipping-policy"]);

    const invalid = await call("ask-agent", { prompt: "" });
    assert.ok(invalid.error || invalid.result?.isError);
    const unconfigured = await call("ask-agent", { prompt: "Shipping?" });
    assert.equal(unconfigured.result.isError, true);
    assert.match(unconfigured.result.content[0].text, /Set MASTRA_MODEL/);

    // Mastra's MCPClient discovers and executes the xmcp tool.
    process.env.MCP_URL = endpoint;
    process.env.MCP_API_KEY = KEY;
    const client = shippingClient();
    try {
      const tools = await shippingTools(client);
      assert.deepEqual(Object.keys(tools), [SHIPPING_TOOL]);
      const result = await tools[SHIPPING_TOOL].execute!({}, {});
      assert.match(JSON.stringify(result), /3–5 business days/);
    } finally {
      await client.disconnect();
    }

    // A deterministic model drives the agent through the real xmcp tool.
    const model = shippingModel();
    const text = await askAgent(
      "How long is shipping?",
      AbortSignal.timeout(TEST_TIMEOUT_MS),
      model
    );
    assert.match(text, /3–5 business days/);
    const calls: CallOptions[] = model.doGenerateCalls;
    assert.equal(calls.length, 2);
    assert.deepEqual(
      calls[0].tools?.map((tool) => tool.name),
      [SHIPPING_TOOL]
    );

    const failing = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new Error("provider secret");
      },
    });
    await assert.rejects(
      askAgent("Shipping?", AbortSignal.timeout(TEST_TIMEOUT_MS), failing),
      { message: "Mastra agent request failed" }
    );

    const controller = new AbortController();
    const hanging = new MockLanguageModelV4({
      doGenerate: async (options) => {
        controller.abort();
        options.abortSignal?.throwIfAborted();
        throw new Error("abort was not forwarded");
      },
    });
    await assert.rejects(askAgent("Shipping?", controller.signal, hanging), {
      name: "AbortError",
    });
  }
);
