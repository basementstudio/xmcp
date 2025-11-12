import z from "zod";

// ------------------------------------------------------------
// Webpack config schema
// ------------------------------------------------------------
export const webpackConfigSchema = z
  .function({
    input: z.tuple([z.any()]),
    output: z.any(),
  })
  .optional();

export type WebpackConfig = z.infer<typeof webpackConfigSchema>;
