import type { HttpTransportConfig } from "./schemas";
import {
  httpTransportConfigSchema,
  stdioTransportConfigSchema,
  templateConfigSchema,
  typescriptConfigSchema,
  corsConfigSchema,
  oauthConfigSchema,
  experimentalConfigSchema,
  DEFAULT_PATHS,
} from "./schemas";
import type { z } from "zod";
import type { XmcpConfigOutputSchema } from "./index";
import type { CorsConfig } from "./schemas";

// Resolved types derived from function return types
// This eliminates the need for explicit type definitions
export type ResolvedHttpConfig =
  | (Extract<z.output<typeof httpTransportConfigSchema>, object> & {
      cors: CorsConfig; // Ensure cors is always present (not optional)
    })
  | null;

export function getResolvedHttpConfig(
  userConfig: HttpTransportConfig | undefined
): ResolvedHttpConfig {
  if (typeof userConfig === "boolean") {
    if (!userConfig) return null;
    // When boolean is true, parse an empty object to get defaults from Zod
    // The schema transform handles merging all defaults including cors
    const parsed = httpTransportConfigSchema.parse({});
    // Type guard narrows from boolean | object to object
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed;
  }
  if (typeof userConfig === "object" && userConfig !== null) {
    // The schema transform handles merging defaults for partial configs
    const parsed = httpTransportConfigSchema.parse(userConfig);
    // Type guard narrows from boolean | object to object
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed;
  }
  return null;
}

export function getResolvedCorsConfig(
  httpConfig: ResolvedHttpConfig
): z.output<typeof corsConfigSchema> {
  return corsConfigSchema.parse(httpConfig?.cors ?? {});
}

export type ResolvedPathsConfig = {
  tools: string | null;
  prompts: string | null;
  resources: string | null;
};

export function getResolvedPathsConfig(
  userConfig: XmcpConfigOutputSchema
): ResolvedPathsConfig {
  const userPaths = userConfig?.paths;
  if (!userPaths) {
    return {
      tools: DEFAULT_PATHS.tools,
      prompts: DEFAULT_PATHS.prompts,
      resources: DEFAULT_PATHS.resources,
    };
  }

  const resolvedPaths: ResolvedPathsConfig = {
    tools: DEFAULT_PATHS.tools,
    prompts: DEFAULT_PATHS.prompts,
    resources: DEFAULT_PATHS.resources,
  };

  // Handle tools path
  if (typeof userPaths.tools === "boolean") {
    resolvedPaths.tools = userPaths.tools ? DEFAULT_PATHS.tools : null;
  } else if (typeof userPaths.tools === "string") {
    resolvedPaths.tools = userPaths.tools;
  }

  // Handle prompts path
  if (typeof userPaths.prompts === "boolean") {
    resolvedPaths.prompts = userPaths.prompts ? DEFAULT_PATHS.prompts : null;
  } else if (typeof userPaths.prompts === "string") {
    resolvedPaths.prompts = userPaths.prompts;
  }

  // Handle resources path
  if (typeof userPaths.resources === "boolean") {
    resolvedPaths.resources = userPaths.resources
      ? DEFAULT_PATHS.resources
      : null;
  } else if (typeof userPaths.resources === "string") {
    resolvedPaths.resources = userPaths.resources;
  }

  return resolvedPaths;
}

export function getResolvedOAuthConfig(
  userConfig: XmcpConfigOutputSchema
): z.output<typeof oauthConfigSchema> | null {
  return userConfig?.experimental?.oauth || null;
}

export type ResolvedStdioConfig = Extract<
  z.output<typeof stdioTransportConfigSchema>,
  object
> | null;

export function getResolvedStdioConfig(
  userConfig: XmcpConfigOutputSchema
): ResolvedStdioConfig {
  const stdioConfig = userConfig?.stdio;
  if (typeof stdioConfig === "boolean") {
    if (!stdioConfig) return null;
    // When boolean is true, parse an empty object to get defaults from Zod
    const parsed = stdioTransportConfigSchema.parse({});
    // Type guard: ensure we have an object (not boolean)
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed;
  }
  if (stdioConfig) {
    // Config is already parsed by Zod, but ensure defaults are applied
    const parsed = stdioTransportConfigSchema.parse(stdioConfig);
    // Type guard: ensure we have an object (not boolean)
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }
    return parsed;
  }
  // When undefined, parse an empty object to get defaults from Zod
  const parsed = stdioTransportConfigSchema.parse({});
  // Type guard: ensure we have an object (not boolean)
  if (typeof parsed !== "object" || parsed === null) {
    return null;
  }
  return parsed;
}

export function getResolvedTemplateConfig(
  userConfig: XmcpConfigOutputSchema
): z.output<typeof templateConfigSchema> {
  const userTemplate = userConfig?.template;
  return templateConfigSchema.parse(userTemplate ?? {});
}

export type ResolvedExperimentalConfig = Pick<
  z.output<typeof experimentalConfigSchema>,
  "adapter"
>;

export function getResolvedExperimentalConfig(
  userConfig: XmcpConfigOutputSchema
): ResolvedExperimentalConfig {
  const experimental = userConfig?.experimental;
  return {
    adapter: experimental?.adapter,
  };
}

export function getResolvedTypescriptConfig(
  userConfig: XmcpConfigOutputSchema
): z.output<typeof typescriptConfigSchema> {
  const typescript = userConfig?.typescript;
  return typescriptConfigSchema.parse(typescript ?? {});
}
