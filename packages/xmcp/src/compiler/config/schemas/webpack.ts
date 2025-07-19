import z from "zod";

// ------------------------------------------------------------
// Webpack config schema
// ------------------------------------------------------------
export const webpackConfigSchema = z
  .function()
  .args(z.any())
  .returns(z.any())
  .optional();

export type WebpackConfig = z.infer<typeof webpackConfigSchema>;
