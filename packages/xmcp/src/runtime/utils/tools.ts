import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { ZodRawShape } from "zod/v3";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import {
  transformToolHandler,
  createToolExtraArguments,
  coerceToolResponse,
} from "./transformers/tool";
import { isReactFile } from "./react";
import { uIResourceRegistry } from "./ext-apps-registry";
import { flattenMeta, hasUIMeta } from "./ui/flatten-meta";
import { splitUIMetaNested } from "./ui/split-meta";
import { isPaidHandler, getX402Registry } from "@/plugins/x402";

/** Validates if a value is a valid Zod schema object */
export function isZodRawShape(value: unknown): value is ZodRawShape {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const obj = value as Record<string, unknown>;
  return Object.entries(obj).every(([key, val]) => {
    if (typeof key !== "string") return false;
    if (typeof val !== "object" || val === null) return false;
    if (!("parse" in val) || typeof val.parse !== "function") return false;
    return true;
  });
}

export function pathToName(path: string): string {
  const fileName = path.split("/").pop() || path;
  return fileName.replace(/\.[^/.]+$/, "");
}

/** Ensures toolConfig has its own annotations object with a title */
export function ensureAnnotations(toolConfig: Pick<ToolMetadata, "name" | "annotations">): void {
  toolConfig.annotations = { ...(toolConfig.annotations ?? {}) };
  if (toolConfig.annotations.title === undefined) {
    toolConfig.annotations.title = toolConfig.name;
  }
}

/** Loads tools and injects them into the server */
export function addToolsToServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  hasTaskStore = false
): McpServer {
  toolModules.forEach((toolModule, path) => {
    const defaultName = pathToName(path);

    const toolConfig: ToolMetadata = {
      name: defaultName,
      description: "No description provided",
    };

    const { default: handler, metadata, schema, outputSchema } = toolModule;

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(toolConfig, metadata);
    }

    // Register paid tools in x402 registry if plugin is installed
    if (isPaidHandler(handler)) {
      const registry = getX402Registry();
      if (registry) {
        registry.set(toolConfig.name, handler.__x402);
      }
    }

    // Determine the actual schema to use
    let toolSchema: ZodRawShape = {};
    if (isZodRawShape(schema)) {
      toolSchema = schema;
    } else if (schema !== undefined && schema !== null) {
      console.warn(
        `Invalid schema for tool "${toolConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
      );
    }

    let toolOutputSchema: ZodRawShape | undefined;
    if (outputSchema !== undefined && outputSchema !== null) {
      if (isZodRawShape(outputSchema)) {
        toolOutputSchema = outputSchema;
      } else {
        throw new Error(
          `Invalid outputSchema for tool "${toolConfig.name}" at ${path}. Expected Record<string, z.ZodType>`
        );
      }
    }

    // Make sure tools has annotations with a title
    ensureAnnotations(toolConfig);

    if (toolConfig._meta === undefined) {
      toolConfig._meta = {};
    }

    const isReact = isReactFile(path);

    const uiWidget = hasUIMeta(toolConfig._meta) || isReact;

    let toolSpecificMeta = toolConfig._meta;

    if (uiWidget) {
      const mcpuiResourceUri = `ui://app/${toolConfig.name}.html`;

      if (!toolConfig._meta.ui) {
        toolConfig._meta.ui = {};
      }
      if (!toolConfig._meta.ui.resourceUri) {
        toolConfig._meta.ui.resourceUri = mcpuiResourceUri;
      }

      const uiSplit = splitUIMetaNested(toolSpecificMeta);
      toolSpecificMeta = uiSplit.toolMeta;
      const resourceSpecificMeta = uiSplit.resourceMeta;

      // Ensure CSP resource domains includes esm.sh
      resourceSpecificMeta.ui = resourceSpecificMeta.ui || {};
      resourceSpecificMeta.ui.csp = resourceSpecificMeta.ui.csp || {};
      resourceSpecificMeta.ui.csp.resourceDomains =
        resourceSpecificMeta.ui.csp.resourceDomains || [];

      if (
        !resourceSpecificMeta.ui.csp.resourceDomains.includes(
          "https://esm.sh"
        )
      ) {
        resourceSpecificMeta.ui.csp.resourceDomains.push("https://esm.sh");
      }

      uIResourceRegistry.add(toolConfig.name, {
        name: toolConfig.name,
        uri: mcpuiResourceUri,
        handler,
        mimeType: "text/html;profile=mcp-app",
        _meta: resourceSpecificMeta,
        toolPath: isReact ? path : undefined,
      });
    }

    const flattenedToolMeta = flattenMeta(toolSpecificMeta);
    const meta = uiWidget ? flattenedToolMeta : undefined;
    let transformedHandler;

    if (isReactFile(path) && uiWidget) {
      transformedHandler = async (args: any, extra: any) => ({
        content: [{ type: "text", text: "" }],
        _meta: meta,
        structuredContent: {
          args,
        },
      });
    } else {
      transformedHandler = transformToolHandler(
        handler,
        meta,
        toolOutputSchema,
        toolConfig.name
      );
    }

    const toolConfigFormatted = {
      title: toolConfig.annotations?.title,
      description: toolConfig.description,
      // Build the object schema using the project's Zod instance to avoid
      // cross-instance v3 shape issues in tools/list JSON schema generation.
      inputSchema: z.object(toolSchema),
      outputSchema: toolOutputSchema
        ? z.object(toolOutputSchema).strict()
        : undefined,
      annotations: toolConfig.annotations,
      _meta: flattenedToolMeta, // Use flattened metadata for MCP protocol
    };

    const taskSupport = toolConfig.taskSupport;
    const isTaskTool = taskSupport === "optional" || taskSupport === "required";

    if (isTaskTool) {
      if (!hasTaskStore) {
        throw new Error(
          `Tool "${toolConfig.name}" declares taskSupport "${taskSupport}" but no task store was found. ` +
            `Add a src/task-store.ts that exports a TaskStore implementation.`
        );
      }

      // Register as a task-augmented tool. The SDK exposes tasks/get,
      // tasks/result, tasks/list and tasks/cancel and routes task-augmented
      // tools/call requests to this handler triple.
      (server as any).experimental.tasks.registerToolTask(
        toolConfig.name,
        { ...toolConfigFormatted, execution: { taskSupport } },
        {
          // Create the task record, let the tool kick off (or run) the work,
          // and return immediately. The tool either returns a result
          // synchronously (stored as the terminal result) or returns nothing
          // and completes the task later via the store from its own worker.
          createTask: async (args: any, extra: any) => {
            const task = await extra.taskStore.createTask({
              ttl: extra.taskRequestedTtl ?? undefined,
            });

            const toolExtra = createToolExtraArguments(extra);
            toolExtra.task = { taskId: task.taskId };

            let response: any = handler(args, toolExtra);
            if (response instanceof Promise) {
              response = await response;
            }

            if (response !== undefined && response !== null) {
              const result = coerceToolResponse(
                response,
                args,
                meta,
                toolOutputSchema,
                toolConfig.name
              );
              await extra.taskStore.storeTaskResult(
                task.taskId,
                result.isError ? "failed" : "completed",
                result
              );
            }

            return { task };
          },
          getTask: (_args: any, extra: any) =>
            extra.taskStore.getTask(extra.taskId),
          getTaskResult: (_args: any, extra: any) =>
            extra.taskStore.getTaskResult(extra.taskId),
        }
      );
    } else {
      // server as any prevents infinite type recursion
      (server as any).registerTool(
        toolConfig.name,
        toolConfigFormatted,
        transformedHandler
      );
    }
  });

  return server;
}
