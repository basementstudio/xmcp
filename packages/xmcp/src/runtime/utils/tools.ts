import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";
import { z } from "zod";
import { ZodRawShape } from "zod/v3";
import { ToolFile } from "./server";
import { ToolMetadata } from "@/types/tool";
import { transformToolHandler } from "./transformers/tool";
import { isReactFile } from "./react";
import { uIResourceRegistry } from "./ext-apps-registry";
import { flattenMeta, hasUIMeta } from "./ui/flatten-meta";
import { splitUIMetaNested } from "./ui/split-meta";
import { isPaidHandler, getX402Registry } from "@/plugins/x402";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types";

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

/** Determines if a tool should be registered based on its metadata and auth context */
export function shouldRegisterTool(
  metadata: ToolMetadata,
  authInfo?: AuthInfo,
  includedInConfig?: boolean
): boolean {
  // enabled: false disables the tool unless overridden by config include/enable
  if (metadata.enabled === false && !includedInConfig) return false;
  // requiresAuth (explicit or implied by requiredScopes)
  if (
    (metadata.requiresAuth || (metadata.requiredScopes?.length ?? 0) > 0) &&
    !authInfo
  )
    return false;
  // requiredScopes — ALL must match
  if (metadata.requiredScopes && metadata.requiredScopes.length > 0) {
    if (
      !metadata.requiredScopes.every((s) => authInfo!.scopes.includes(s))
    )
      return false;
  }
  return true;
}

/** Resolves tool dependencies iteratively. Returns the set of tool names that passed. */
export function resolveDependencies(
  candidates: Map<string, ToolMetadata>,
  passedFilter: Set<string>
): Set<string> {
  const resolved = new Set<string>();

  // Tools with no dependencies pass immediately
  for (const [name, meta] of candidates) {
    if (
      passedFilter.has(name) &&
      (!meta.dependsOn || meta.dependsOn.length === 0)
    ) {
      resolved.add(name);
    }
  }

  // Iterative resolution for tools with dependencies
  let changed = true;
  const maxIterations = candidates.size;
  let iteration = 0;

  while (changed && iteration < maxIterations) {
    changed = false;
    iteration++;
    for (const [name, meta] of candidates) {
      if (resolved.has(name)) continue;
      if (!passedFilter.has(name)) continue;
      if (meta.dependsOn?.every((dep) => resolved.has(dep))) {
        resolved.add(name);
        changed = true;
      }
    }
  }

  // Warn about unresolved tools (circular deps or missing deps)
  for (const [name, meta] of candidates) {
    if (passedFilter.has(name) && !resolved.has(name) && meta.dependsOn?.length) {
      const missing = meta.dependsOn.filter((d) => !resolved.has(d));
      console.warn(
        `[xmcp] Tool "${name}" excluded: unresolved dependencies [${missing.join(", ")}]`
      );
    }
  }

  return resolved;
}

/** Loads tools and injects them into the server, applying filtering */
export function addToolsToServer(
  server: McpServer,
  toolModules: Map<string, ToolFile>,
  authInfo?: AuthInfo,
  enableList?: string[]
): McpServer {
  // --- Pass 1: Build tool configs and evaluate per-tool filters ---
  const passedFilter = new Set<string>();
  const candidates = new Map<string, ToolMetadata>();
  const toolData = new Map<
    string,
    { path: string; toolModule: ToolFile; toolConfig: ToolMetadata }
  >();

  toolModules.forEach((toolModule, path) => {
    const defaultName = pathToName(path);

    const toolConfig: ToolMetadata = {
      name: defaultName,
      description: "No description provided",
    };

    const { metadata } = toolModule;

    if (typeof metadata === "object" && metadata !== null) {
      Object.assign(toolConfig, metadata);
    }

    const includedInConfig = enableList?.includes(toolConfig.name) ?? false;

    if (!shouldRegisterTool(toolConfig, authInfo, includedInConfig)) {
      return; // skip this tool
    }

    passedFilter.add(toolConfig.name);
    candidates.set(toolConfig.name, toolConfig);
    toolData.set(toolConfig.name, { path, toolModule, toolConfig });
  });

  // --- Pass 2: Resolve dependencies ---
  const resolved = resolveDependencies(candidates, passedFilter);

  // --- Pass 3: Register surviving tools ---
  for (const [name, data] of toolData) {
    if (!resolved.has(name)) continue;

    const { path, toolModule, toolConfig } = data;
    const { default: handler, schema, outputSchema } = toolModule;

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

    // server as any prevents infinite type recursion
    (server as any).registerTool(
      toolConfig.name,
      toolConfigFormatted,
      transformedHandler
    );
  }

  return server;
}
