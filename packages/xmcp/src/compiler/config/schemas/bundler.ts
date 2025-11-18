import z from "zod";

// ------------------------------------------------------------
// Bundler config schema - currently supports Rspack
// ------------------------------------------------------------
export const bundlerConfigSchema = z
  .function()
  .args(z.any())
  .returns(z.any())
  .optional();

export type BundlerConfig = z.infer<typeof bundlerConfigSchema>;
