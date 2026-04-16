import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol";
import {
  CreateMessageResultSchema,
  CreateMessageResultWithToolsSchema,
  type CreateMessageResult,
  type CreateMessageResultWithTools,
  type ServerNotification,
  type ServerRequest,
  type ToolResultContent,
  type ToolUseContent,
} from "@modelcontextprotocol/sdk/types";
import type {
  SampleContent,
  SampleMessage,
  SampleMessageContentInput,
  SampleRequest,
  SampleResult,
  ToolRequestOptions,
} from "@/types/tool";
import {
  resolveSamplingTools,
  type SamplingToolRegistration,
  type SamplingToolRegistry,
} from "./sampling-tool-registry";

type SamplingExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
type SamplingResponse = CreateMessageResult | CreateMessageResultWithTools;

type SamplingContext = {
  currentToolName?: string;
  samplingToolRegistry?: SamplingToolRegistry;
};

const samplingContexts = new WeakMap<SamplingExtra, SamplingContext>();

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
}

function isUnsupportedSamplingError(error: unknown): boolean {
  const message = getErrorMessage(error);

  return (
    message.includes("sampling/createMessage") ||
    message.includes("Method not found") ||
    message.includes("does not support MCP sampling")
  );
}

function normalizeSamplingError(error: unknown): Error {
  if (isUnsupportedSamplingError(error)) {
    return new Error(
      "Connected MCP client does not support MCP sampling yet (missing sampling/createMessage)."
    );
  }

  return error instanceof Error ? error : new Error(getErrorMessage(error));
}

function createToolErrorResult(
  toolUseId: string,
  message: string
): ToolResultContent {
  return {
    type: "tool_result",
    toolUseId,
    isError: true,
    content: [
      {
        type: "text",
        text: message,
      },
    ],
  };
}

function toSamplingMessage(response: SamplingResponse) {
  return {
    role: response.role,
    content: response.content,
    _meta: response._meta,
  };
}

function toTextBlock(text: string): Extract<SampleContent, { type: "text" }> {
  return {
    type: "text",
    text,
  };
}

function normalizeMessageContent(
  content: SampleMessageContentInput
): SampleMessage["content"] {
  if (typeof content === "string") {
    return toTextBlock(content);
  }

  if (Array.isArray(content)) {
    return [...content];
  }

  return content as SampleMessage["content"];
}

function normalizeMessages(messages: SampleRequest["messages"]): SampleMessage[] {
  return messages.map((message) => ({
    ...message,
    content: normalizeMessageContent(message.content),
  }));
}

function extractToolUses(response: CreateMessageResultWithTools): ToolUseContent[] {
  return asArray(response.content).filter(
    (content): content is ToolUseContent => content.type === "tool_use"
  );
}

async function executeToolUse(
  toolUse: ToolUseContent,
  extra: SamplingExtra,
  toolMap: Map<string, SamplingToolRegistration>
): Promise<ToolResultContent> {
  const tool = toolMap.get(toolUse.name);

  if (!tool) {
    return createToolErrorResult(
      toolUse.id,
      `Tool "${toolUse.name}" is not available for sampling.`
    );
  }

  try {
    const validatedInput = tool.validateInput(toolUse.input);
    const result = await tool.execute(validatedInput as any, extra);

    return {
      type: "tool_result",
      toolUseId: toolUse.id,
      content: result.content ?? [],
      ...(result.structuredContent
        ? { structuredContent: result.structuredContent }
        : {}),
      ...(result.isError ? { isError: true } : {}),
      ...(result._meta ? { _meta: result._meta } : {}),
    };
  } catch (error) {
    return createToolErrorResult(
      toolUse.id,
      `Tool "${toolUse.name}" failed: ${getErrorMessage(error)}`
    );
  }
}

async function sendSamplingRequest(
  extra: SamplingExtra,
  params: any,
  resultSchema: any,
  options?: ToolRequestOptions
) {
  try {
    return await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params,
      } as any,
      resultSchema,
      options
    );
  } catch (error) {
    throw normalizeSamplingError(error);
  }
}

function getSamplingContext(extra: SamplingExtra): SamplingContext {
  const context = samplingContexts.get(extra);

  if (!context) {
    throw new Error(
      "sample() can only be called from inside an xmcp tool handler."
    );
  }

  return context;
}

export function bindSamplingContext(
  extra: SamplingExtra,
  context: SamplingContext
): void {
  samplingContexts.set(extra, context);
}

export function clearSamplingContext(extra: SamplingExtra): void {
  samplingContexts.delete(extra);
}

export async function sample(
  extra: SamplingExtra,
  request: SampleRequest,
  options?: ToolRequestOptions
): Promise<SampleResult> {
  const { currentToolName, samplingToolRegistry } = getSamplingContext(extra);
  const {
    tools: toolSelection,
    maxSteps,
    messages: inputMessages,
    ...params
  } = request;
  const messages = normalizeMessages(inputMessages);

  if (!toolSelection) {
    return sendSamplingRequest(
      extra,
      {
        ...params,
        messages,
      },
      CreateMessageResultSchema,
      options
    );
  }

  const resolvedTools = resolveSamplingTools(
    toolSelection,
    samplingToolRegistry
  ).filter(
    (tool) => toolSelection !== "all" || tool.definition.name !== currentToolName
  );

  if (resolvedTools.length === 0) {
    throw new Error(
      toolSelection === "all" && currentToolName
        ? `Sampling requested "all" tools, but "${currentToolName}" is the only available tool. Pass explicit tool names or omit "tools".`
        : 'Sampling requested tools, but no tools were registered. Pass explicit tool names or omit "tools".'
    );
  }

  const toolMap = new Map(
    resolvedTools.map((tool) => [tool.definition.name, tool] as const)
  );

  let currentMessages = [...messages];
  let step = 0;

  while (true) {
    const response = await sendSamplingRequest(
      extra,
      {
        ...params,
        messages: currentMessages,
        tools: resolvedTools.map((tool) => tool.definition),
      },
      CreateMessageResultWithToolsSchema,
      options
    );

    const toolUses = extractToolUses(response);

    if (toolUses.length === 0) {
      return response;
    }

    if (typeof maxSteps === "number" && step >= maxSteps) {
      throw new Error(
        `Sampling exceeded the configured maxSteps (${maxSteps}).`
      );
    }

    const toolResults: ToolResultContent[] = [];

    for (const toolUse of toolUses) {
      toolResults.push(await executeToolUse(toolUse, extra, toolMap));
    }

    currentMessages = [
      ...currentMessages,
      toSamplingMessage(response),
      {
        role: "user",
        content: toolResults,
      },
    ];

    step += 1;
  }
}
