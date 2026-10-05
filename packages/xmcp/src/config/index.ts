import type { RspackOptions } from "@rspack/core";
import { z } from "zod/v3";

import {
  bundlerConfigSchema,
  componentsConfigSchema,
  experimentalConfigSchema,
  httpTransportConfigSchema,
  pathsConfigSchema,
  stdioTransportConfigSchema,
  templateConfigSchema,
  typescriptConfigSchema,
} from "./schemas";

/**
 * xmcp Config schema
 */
export const configSchema = z.object({
  stdio: stdioTransportConfigSchema.optional(),
  http: httpTransportConfigSchema.optional(),
  experimental: experimentalConfigSchema.optional(),
  paths: pathsConfigSchema.optional(),
  bundler: bundlerConfigSchema.optional(),
  template: templateConfigSchema.optional(),
  typescript: typescriptConfigSchema.optional(),
  observability: z.object({ enabled: z.boolean() }).optional(),
  components: componentsConfigSchema.optional(),
});

type BundlerConfigType = { bundler?: (config: RspackOptions) => RspackOptions };

export type XmcpConfigInputSchema = Omit<
  z.input<typeof configSchema>,
  "bundler"
> &
  BundlerConfigType;

export type XmcpConfigOutputSchema = Omit<
  z.output<typeof configSchema>,
  "bundler"
> &
  BundlerConfigType;

// Re-export resolved types from utils (where they're defined)
// Types are derived from resolution functions using ReturnType
export type {
  ResolvedExperimentalConfig,
  ResolvedHttpConfig,
  ResolvedPathsConfig,
  ResolvedStdioConfig,
} from "./utils";

// Template, TypeScript, and CORS configs don't need resolved types
// They can use Zod's output types directly: z.output<typeof templateConfigSchema>

// Re-export all types from schemas
export type {
  BundlerConfig,
  ComponentsConfig,
  ComponentSelector,
  CorsConfig,
  ExperimentalConfig,
  HttpTransportConfig,
  PathsConfig,
  StdioTransportConfig,
  TemplateConfig,
  TypescriptConfig,
} from "./schemas";
export {
  getResolvedCorsConfig,
  getResolvedExperimentalConfig,
  getResolvedHttpConfig,
  getResolvedPathsConfig,
  getResolvedStdioConfig,
  getResolvedTemplateConfig,
  getResolvedTypescriptConfig,
} from "./utils";
