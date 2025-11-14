import { z } from "zod";

// ------------------------------------------------------------
// TypeScript config schema
// ------------------------------------------------------------
export const typescriptConfigSchema = z.object({
  skipTypeCheck: z.boolean().default(false),
});

export type TypescriptConfig = z.infer<typeof typescriptConfigSchema>;
