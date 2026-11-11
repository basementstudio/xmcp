import {
  type ListPromptsResult,
  type ListResourcesResult,
  type ListResourceTemplatesResult,
  type ListToolsResult,
  type McpServer,
  ProtocolError,
  ProtocolErrorCode,
  ResourceNotFoundError,
  type ResourceTemplate,
} from "@modelcontextprotocol/server";

import type {
  McpAuthorize,
  McpAuthorizeComponent,
  McpAuthorizeOperation,
  McpComponentMetadata,
  McpMiddleware,
  McpMiddlewareContext,
  McpToolMetadata,
} from "@/types/mcp-middleware";

import { uIResourceRegistry } from "./ext-apps-registry";

type Component<T extends McpAuthorizeComponent["type"]> = Extract<
  McpAuthorizeComponent,
  { type: T }
>;

/** Components captured while they are registered, keyed like the SDK keys them. */
export interface ComponentRegistry {
  readonly tools: Map<string, Component<"tool">>;
  readonly prompts: Map<string, Component<"prompt">>;
  readonly resources: Map<string, Component<"resource">>;
  readonly templates: Map<
    string,
    { component: Component<"resourceTemplate">; template: ResourceTemplate }
  >;
  /** Generated UI resources follow their owning tool, as component visibility does. */
  readonly uiOwners: Map<string, Component<"tool">>;
}

export function normalizeAuthorize(value: unknown): McpAuthorize | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "function") {
    throw new Error("src/middleware.ts must export authorize as a function");
  }
  return value as McpAuthorize;
}

function tagsOf(meta: Record<string, unknown> | undefined) {
  const tags = meta?.["xmcp/tags"];
  return Array.isArray(tags) ? (tags as string[]) : undefined;
}

type Config = {
  title?: string;
  description?: string;
  mimeType?: string;
  annotations?: McpToolMetadata["annotations"];
  icons?: McpComponentMetadata["icons"];
  _meta?: Record<string, unknown>;
};

/**
 * Record each component through McpServer's public registration methods during
 * setup, then restore them. Listings, direct access and completion all resolve
 * the same frozen metadata.
 */
export function createComponentRegistry(): ComponentRegistry {
  return {
    tools: new Map(),
    prompts: new Map(),
    resources: new Map(),
    templates: new Map(),
    uiOwners: new Map(),
  };
}

export function recordComponents(
  server: McpServer,
  registry: ComponentRegistry,
  snapshot: <T>(value: T) => T,
  register: () => void
): void {
  const originals = {
    registerTool: server.registerTool,
    registerPrompt: server.registerPrompt,
    registerResource: server.registerResource,
  };
  server.registerTool = ((name: string, config: Config, ...rest: unknown[]) => {
    const metadata = snapshot<McpToolMetadata>({
      name,
      description: config.description ?? "",
      annotations: config.annotations,
      icons: config.icons,
      tags: tagsOf(config._meta),
      _meta: config._meta,
    });
    registry.tools.set(name, Object.freeze({ type: "tool", name, metadata }));
    return Reflect.apply(originals.registerTool, server, [
      name,
      config,
      ...rest,
    ]);
  }) as typeof server.registerTool;
  server.registerPrompt = ((
    name: string,
    config: Config,
    ...rest: unknown[]
  ) => {
    const metadata = snapshot<McpComponentMetadata>({
      name,
      title: config.title,
      description: config.description,
      icons: config.icons,
      tags: tagsOf(config._meta),
      _meta: config._meta,
    });
    registry.prompts.set(
      name,
      Object.freeze({ type: "prompt", name, metadata })
    );
    return Reflect.apply(originals.registerPrompt, server, [
      name,
      config,
      ...rest,
    ]);
  }) as typeof server.registerPrompt;
  server.registerResource = ((
    name: string,
    uriOrTemplate: string | ResourceTemplate,
    config: Config,
    ...rest: unknown[]
  ) => {
    const metadata = snapshot<McpComponentMetadata>({
      name,
      title: config.title,
      description: config.description,
      icons: config.icons,
      mimeType: config.mimeType,
      tags: tagsOf(config._meta),
      _meta: config._meta,
    });
    if (typeof uriOrTemplate === "string") {
      registry.resources.set(
        uriOrTemplate,
        Object.freeze({ type: "resource", name, uri: uriOrTemplate, metadata })
      );
    } else {
      const uriTemplate = uriOrTemplate.uriTemplate.toString();
      registry.templates.set(name, {
        component: Object.freeze({
          type: "resourceTemplate",
          name,
          uriTemplate,
          metadata,
        }),
        template: uriOrTemplate,
      });
    }
    return Reflect.apply(originals.registerResource, server, [
      name,
      uriOrTemplate,
      config,
      ...rest,
    ]);
  }) as typeof server.registerResource;
  try {
    register();
  } finally {
    Object.assign(server, originals);
  }
  for (const [toolName, resource] of uIResourceRegistry.getAll()) {
    const tool = registry.tools.get(toolName);
    if (tool) registry.uiOwners.set(resource.uri, tool);
  }
}

/** Mirror the SDK's resources/read lookup: exact static URI, then templates in order. */
function resourceComponent(
  registry: ComponentRegistry,
  uri: string,
  listed = false
): McpAuthorizeComponent | undefined {
  let normalized: string;
  try {
    normalized = new URL(uri).toString();
  } catch {
    // Let the SDK report the invalid URI.
    return undefined;
  }
  // Listings echo the registered key; reads resolve only the normalized URL.
  for (const key of listed ? [uri, normalized] : [normalized]) {
    const component = registry.uiOwners.get(key) ?? registry.resources.get(key);
    if (component) return component;
  }
  for (const { component, template } of registry.templates.values()) {
    if (template.uriTemplate.match(normalized)) return component;
  }
  return undefined;
}

const EMPTY_COMPLETION = { completion: { values: [], hasMore: false } };

/**
 * Built-in first MCP middleware. Denied components are filtered from listings
 * and rejected with the same errors the SDK uses for unknown components, so a
 * caller cannot tell a denied component from a missing one. Only an explicit
 * `true` allows access.
 */
export function createAuthorizationMiddleware(
  authorize: McpAuthorize,
  registry: ComponentRegistry
): McpMiddleware {
  const allowed = async (
    ctx: McpMiddlewareContext,
    component: McpAuthorizeComponent | undefined,
    operation: McpAuthorizeOperation
  ) => !component || (await authorize(ctx, component, operation)) === true;
  async function visible<T>(
    ctx: McpMiddlewareContext,
    items: T[],
    resolve: (item: T) => McpAuthorizeComponent | undefined
  ): Promise<T[]> {
    // Leave malformed results from user middleware for SDK validation to report.
    if (!Array.isArray(items)) return items;
    const decisions = await Promise.all(
      items.map((item) => allowed(ctx, resolve(item), "list"))
    );
    return items.filter((_, index) => decisions[index]);
  }

  return async (ctx, next) => {
    switch (ctx.method) {
      case "tools/call": {
        const { name } = ctx.params;
        if (!(await allowed(ctx, registry.tools.get(name), "call"))) {
          throw new ProtocolError(
            ProtocolErrorCode.InvalidParams,
            `Tool ${name} not found`
          );
        }
        return next();
      }
      case "prompts/get": {
        const { name } = ctx.params;
        if (!(await allowed(ctx, registry.prompts.get(name), "get"))) {
          throw new ProtocolError(
            ProtocolErrorCode.InvalidParams,
            `Prompt ${name} not found`
          );
        }
        return next();
      }
      case "resources/read": {
        const { uri } = ctx.params;
        if (!(await allowed(ctx, resourceComponent(registry, uri), "read"))) {
          throw new ResourceNotFoundError(uri);
        }
        return next();
      }
      case "completion/complete": {
        const { ref } = ctx.params;
        const component =
          ref.type === "ref/prompt"
            ? registry.prompts.get(ref.name)
            : ([...registry.templates.values()].find(
                ({ component }) => component.uriTemplate === ref.uri
              )?.component ?? registry.resources.get(ref.uri));
        if (!(await allowed(ctx, component, "complete"))) {
          return EMPTY_COMPLETION;
        }
        return next();
      }
      case "tools/list": {
        const result = (await next()) as ListToolsResult;
        return {
          ...result,
          tools: await visible(ctx, result.tools, (tool) =>
            registry.tools.get(tool.name)
          ),
        };
      }
      case "prompts/list": {
        const result = (await next()) as ListPromptsResult;
        return {
          ...result,
          prompts: await visible(ctx, result.prompts, (prompt) =>
            registry.prompts.get(prompt.name)
          ),
        };
      }
      case "resources/list": {
        const result = (await next()) as ListResourcesResult;
        return {
          ...result,
          resources: await visible(ctx, result.resources, (resource) =>
            resourceComponent(registry, resource.uri, true)
          ),
        };
      }
      case "resources/templates/list": {
        const result = (await next()) as ListResourceTemplatesResult;
        return {
          ...result,
          resourceTemplates: await visible(
            ctx,
            result.resourceTemplates,
            (template) => registry.templates.get(template.name)?.component
          ),
        };
      }
      default:
        return next();
    }
  };
}
