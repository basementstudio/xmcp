import { z } from "zod/v3";
import {
  stdioTransportConfigSchema,
  httpTransportConfigSchema,
  experimentalConfigSchema,
  pathsConfigSchema,
  templateConfigSchema,
  typescriptConfigSchema,
  bundlerConfigSchema,
} from "./schemas";
import type { RspackOptions } from "@rspack/core";

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
  ResolvedHttpConfig,
  ResolvedStdioConfig,
  ResolvedPathsConfig,
  ResolvedExperimentalConfig,
} from "./utils";

// Template, TypeScript, and CORS configs don't need resolved types
// They can use Zod's output types directly: z.output<typeof templateConfigSchema>

// Re-export all types from schemas
export type {
  HttpTransportConfig,
  StdioTransportConfig,
  CorsConfig,
  ExperimentalConfig,
  PathsConfig,
  BundlerConfig,
  TemplateConfig,
  TypescriptConfig,
} from "./schemas";
