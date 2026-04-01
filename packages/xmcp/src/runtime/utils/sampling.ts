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
  SampleRequest,
  SampleResult,
  ToolExtraArguments,
  ToolRequestOptions,
} from "@/types/tool";
import { resolveSamplingTools } from "./sampling-tool-registry";

const DEFAULT_SAMPLE_MAX_STEPS = 8;

type SamplingExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
type SamplingResponse = CreateMessageResult | CreateMessageResultWithTools;

function asArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return String(error);
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

function extractToolUses(response: CreateMessageResultWithTools): ToolUseContent[] {
  return asArray(response.content).filter(
    (content): content is ToolUseContent => content.type === "tool_use"
  );
}

async function executeToolUse(
  toolUse: ToolUseContent,
  extra: SamplingExtra,
  toolMap: Map<string, ReturnType<typeof resolveSamplingTools>[number]>
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

export async function sampleFromClient(
  extra: SamplingExtra,
  request: SampleRequest,
  options?: ToolRequestOptions,
  currentToolName?: string
): Promise<SampleResult> {
  const { tools: toolSelection, maxSteps = DEFAULT_SAMPLE_MAX_STEPS, ...params } =
    request;

  if (!toolSelection) {
    return extra.sendRequest(
      {
        method: "sampling/createMessage",
        params,
      },
      CreateMessageResultSchema,
      options
    );
  }

  const resolvedTools = resolveSamplingTools(toolSelection).filter(
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

  let messages = [...params.messages];
  let step = 0;

  while (true) {
    const response = await extra.sendRequest(
      {
        method: "sampling/createMessage",
        params: {
          ...params,
          messages,
          tools: resolvedTools.map((tool) => tool.definition),
        },
      },
      CreateMessageResultWithToolsSchema,
      options
    );

    const toolUses = extractToolUses(response);

    if (toolUses.length === 0) {
      return response;
    }

    if (step >= maxSteps) {
      throw new Error(
        `Sampling exceeded the configured maxSteps (${maxSteps}).`
      );
    }

    const toolResults: ToolResultContent[] = [];

    for (const toolUse of toolUses) {
      toolResults.push(await executeToolUse(toolUse, extra, toolMap));
    }

    messages = [
      ...messages,
      toSamplingMessage(response),
      {
        role: "user",
        content: toolResults,
      },
    ];

    step += 1;
  }
}

export function createToolExtraArguments(
  extra: SamplingExtra,
  currentToolName?: string
): ToolExtraArguments {
  return Object.assign({}, extra, {
    sendRequest: (request: any, resultSchema: any, options?: ToolRequestOptions) =>
      extra.sendRequest(request, resultSchema, options),
    sample: (request: SampleRequest, options?: ToolRequestOptions) =>
      sampleFromClient(extra, request, options, currentToolName),
  }) as ToolExtraArguments;
}
