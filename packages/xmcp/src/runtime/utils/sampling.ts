import {
  SdkError,
  SdkErrorCode,
  ServerContext,
  CreateMessageRequestParamsBase,
} from "@modelcontextprotocol/server";
import type {
  SampleRequest,
  SampleResult,
  ToolRequestOptions,
} from "@/types/tool";

const ALLOWED_SAMPLE_REQUEST_KEYS = new Set([
  "_meta",
  "includeContext",
  "maxTokens",
  "messages",
  "metadata",
  "modelPreferences",
  "stopSequences",
  "systemPrompt",
  "temperature",
]);
// Part of the SDK request params, but the client tool-loop and task flows are
// not wired through xmcp yet. Reject them explicitly instead of sending
// requests the framework cannot follow through on.
const UNSUPPORTED_SAMPLE_REQUEST_KEYS = new Set([
  "task",
  "toolChoice",
  "tools",
]);

const SUPPORTED_MESSAGE_CONTENT_TYPES = new Set(["text", "image", "audio"]);

export async function sampleFromTool(
  ctx: ServerContext,
  request: SampleRequest,
  options?: ToolRequestOptions
): Promise<SampleResult> {
  const params = normalizeSampleRequest(request);

  try {
    return (await ctx.mcpReq.requestSampling(params, options)) as SampleResult;
  } catch (error) {
    if (
      error instanceof SdkError &&
      error.code === SdkErrorCode.MethodNotSupportedByProtocolVersion
    ) {
      throw new Error(
        "extra.sample() is not available on protocol revision 2026-07-28: " +
          "server-initiated sampling was replaced by multi round-trip " +
          "requests. Return inputRequired({ ... }) with " +
          "inputRequired.createMessage(...) from the tool handler instead " +
          "(re-exported from xmcp); the client fulfils the embedded requests " +
          "and retries the tool call."
      );
    }
    throw error;
  }
}

function normalizeSampleRequest(
  request: SampleRequest
): CreateMessageRequestParamsBase {
  assertPlainObject(request, "Sampling request must be a plain object.");

  const requestKeys = Object.keys(request);
  const unsupportedKeys = requestKeys.filter((key) =>
    UNSUPPORTED_SAMPLE_REQUEST_KEYS.has(key)
  );

  if (unsupportedKeys.length > 0) {
    throw new Error(
      `Sampling request key(s) not supported by xmcp yet: ${unsupportedKeys.join(", ")}.`
    );
  }

  const extraKeys = requestKeys.filter(
    (key) => !ALLOWED_SAMPLE_REQUEST_KEYS.has(key)
  );

  if (extraKeys.length > 0) {
    throw new Error(
      `Sampling request includes unsupported key(s): ${extraKeys.join(", ")}.`
    );
  }

  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error("Sampling requires at least one message.");
  }

  for (const [index, message] of request.messages.entries()) {
    assertValidMessage(index, message);
  }

  if (typeof request.maxTokens !== "number") {
    throw new Error("Sampling requires a numeric maxTokens.");
  }

  return request as CreateMessageRequestParamsBase;
}

function assertValidMessage(index: number, message: unknown): void {
  assertPlainObject(
    message,
    `Sampling message at index ${index} must be a plain object.`
  );

  if (message.role !== "user" && message.role !== "assistant") {
    throw new Error(
      `Sampling message at index ${index} requires role "user" or "assistant".`
    );
  }

  const content = message.content;
  assertPlainObject(
    content,
    `Sampling message at index ${index} requires a content object.`
  );

  const contentType = content.type;
  if (
    typeof contentType !== "string" ||
    !SUPPORTED_MESSAGE_CONTENT_TYPES.has(contentType)
  ) {
    throw new Error(
      `Sampling message at index ${index} uses unsupported content type "${String(contentType)}". Supported types are text, image, and audio.`
    );
  }

  if (contentType === "text" && typeof content.text !== "string") {
    throw new Error(
      `Sampling message at index ${index} requires string text content.`
    );
  }

  if (
    (contentType === "image" || contentType === "audio") &&
    (typeof content.data !== "string" || typeof content.mimeType !== "string")
  ) {
    throw new Error(
      `Sampling message at index ${index} requires base64 data and a mimeType.`
    );
  }
}

function assertPlainObject(
  value: unknown,
  errorMessage: string
): asserts value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(errorMessage);
  }
}
