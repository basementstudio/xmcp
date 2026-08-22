import { test } from "node:test";
import assert from "node:assert";
import {
  SdkError,
  SdkErrorCode,
  type ServerContext,
} from "@modelcontextprotocol/server";
import { sampleFromTool } from "../sampling";
import type { SampleRequest, SampleResult } from "@/types/tool";

const SAMPLE_RESULT: SampleResult = {
  model: "stub-model",
  role: "assistant",
  content: {
    type: "text",
    text: "stubbed completion",
  },
};

type RecordedCall = {
  params: Record<string, unknown>;
  options?: Record<string, unknown>;
};

const createServerContextStub = (options: { samplingError?: Error } = {}) => {
  const calls: RecordedCall[] = [];
  const ctx = {
    sessionId: undefined,
    mcpReq: {
      requestSampling: async (
        params: RecordedCall["params"],
        requestOptions?: RecordedCall["options"]
      ) => {
        calls.push({ params, options: requestOptions });
        if (options.samplingError) {
          throw options.samplingError;
        }
        return SAMPLE_RESULT;
      },
    },
  } as unknown as ServerContext;

  return { calls, ctx };
};

const VALID_REQUEST: SampleRequest = {
  messages: [
    {
      role: "user",
      content: { type: "text", text: "Summarize this changelog." },
    },
  ],
  systemPrompt: "You are a release-note writer.",
  maxTokens: 200,
};

test("sampleFromTool forwards the normalized params to requestSampling", async () => {
  const { calls, ctx } = createServerContextStub();

  const result = await sampleFromTool(ctx, VALID_REQUEST, { timeout: 1000 });

  assert.strictEqual(calls.length, 1);
  assert.deepStrictEqual(calls[0].params, VALID_REQUEST);
  assert.deepStrictEqual(calls[0].options, { timeout: 1000 });
  assert.deepStrictEqual(result, SAMPLE_RESULT);
});

test("sampleFromTool forwards modelPreferences and sampling options", async () => {
  const { calls, ctx } = createServerContextStub();

  await sampleFromTool(ctx, {
    ...VALID_REQUEST,
    modelPreferences: {
      hints: [{ name: "claude" }],
      costPriority: 0.2,
      speedPriority: 0.3,
      intelligencePriority: 0.9,
    },
    temperature: 0.5,
    stopSequences: ["END"],
    includeContext: "none",
  });

  const params = calls[0].params;
  assert.deepStrictEqual(params.modelPreferences, {
    hints: [{ name: "claude" }],
    costPriority: 0.2,
    speedPriority: 0.3,
    intelligencePriority: 0.9,
  });
  assert.strictEqual(params.temperature, 0.5);
  assert.deepStrictEqual(params.stopSequences, ["END"]);
  assert.strictEqual(params.includeContext, "none");
});

test("sampleFromTool rejects non-object requests", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, "summarize" as unknown as SampleRequest),
    /Sampling request must be a plain object\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool rejects requests without messages", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, {
      messages: [],
      maxTokens: 100,
    }),
    /Sampling requires at least one message\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool rejects requests without numeric maxTokens", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, {
      messages: VALID_REQUEST.messages,
    } as SampleRequest),
    /Sampling requires a numeric maxTokens\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool rejects tools and toolChoice explicitly", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, {
      ...VALID_REQUEST,
      tools: [],
      toolChoice: { mode: "auto" },
    } as unknown as SampleRequest),
    /Sampling request key\(s\) not supported by xmcp yet: tools, toolChoice\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool rejects unknown request keys", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, {
      ...VALID_REQUEST,
      prompt: "typo-field",
    } as unknown as SampleRequest),
    /Sampling request includes unsupported key\(s\): prompt\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool rejects invalid message content", async () => {
  const { calls, ctx } = createServerContextStub();

  await assert.rejects(
    sampleFromTool(ctx, {
      messages: [
        {
          role: "user",
          content: { type: "text" },
        },
      ],
      maxTokens: 100,
    } as unknown as SampleRequest),
    /Sampling message at index 0 requires string text content\./
  );
  assert.strictEqual(calls.length, 0);
});

test("sampleFromTool explains the 2026-07-28 replacement when the era rejects it", async () => {
  const { ctx } = createServerContextStub({
    samplingError: new SdkError(
      SdkErrorCode.MethodNotSupportedByProtocolVersion,
      "method not supported"
    ),
  });

  await assert.rejects(
    sampleFromTool(ctx, VALID_REQUEST),
    /inputRequired\.createMessage/
  );
});
