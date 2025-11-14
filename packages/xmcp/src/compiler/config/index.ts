import { z } from "zod";
import {
  stdioTransportConfigSchema,
  httpTransportConfigSchema,
  experimentalConfigSchema,
  pathsConfigSchema,
  webpackConfigSchema,
  templateConfigSchema,
  typescriptConfigSchema,
} from "./schemas";
import { Configuration } from "webpack";

/**
 * xmcp Config schema
 */
export const configSchema = z.object({
  stdio: stdioTransportConfigSchema.optional(),
  http: httpTransportConfigSchema.optional(),
  experimental: experimentalConfigSchema.optional(),
  paths: pathsConfigSchema.optional(),
  webpack: webpackConfigSchema.optional(),
  template: templateConfigSchema.optional(),
  typescript: typescriptConfigSchema.optional(),
});

type WebpackConfig = { webpack?: (config: Configuration) => Configuration };

export type XmcpConfigInputSchema = Omit<
  z.input<typeof configSchema>,
  "webpack"
> &
  WebpackConfig;

export type XmcpConfigOutputSchema = Omit<
  z.output<typeof configSchema>,
  "webpack"
> &
  WebpackConfig;

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
// OAuth config is just OAuthConfig | null, can be used inline

// Re-export all types from schemas
export type {
  HttpTransportConfig,
  StdioTransportConfig,
  CorsConfig,
  OAuthConfig,
  ExperimentalConfig,
  PathsConfig,
  WebpackConfig,
  TemplateConfig,
  TypescriptConfig,
} from "./schemas";
