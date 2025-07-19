import { z } from "zod";
import {
  stdioTransportConfigSchema,
  httpTransportConfigSchema,
  experimentalConfigSchema,
  pathsConfigSchema,
  webpackConfigSchema,
} from "./schemas";

/**
 * xmcp Config schema
 */
export const configSchema = z.object({
  stdio: stdioTransportConfigSchema.optional(),
  http: httpTransportConfigSchema.optional(),
  experimental: experimentalConfigSchema.optional(),
  paths: pathsConfigSchema.optional(),
  webpack: webpackConfigSchema.optional(),
});

export type ConfigSchema = z.infer<typeof configSchema>;

export type InputSchema = z.input<typeof configSchema>;
export type OutputSchema = z.output<typeof configSchema>;
