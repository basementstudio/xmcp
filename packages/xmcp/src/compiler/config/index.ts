import { z } from "zod";
import {
  stdioTransportConfigSchema,
  httpTransportConfigSchema,
  experimentalConfigSchema,
  pathsConfigSchema,
  webpackConfigSchema,
  templateConfigSchema,
} from "./schemas";
// import { Configuration } from "webpack";
import { RspackOptions } from "@rspack/core";

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
});

// type WebpackConfig = { webpack?: (config: Configuration) => Configuration };

type RSPackConfig = { rspack?: (config: RspackOptions) => RspackOptions };

export type XmcpConfigInputSchema = Omit<
  z.input<typeof configSchema>,
  "rspack"
> &
  RSPackConfig;

export type XmcpConfigOuputSchema = Omit<
  z.output<typeof configSchema>,
  "rspack"
> &
  RSPackConfig;
