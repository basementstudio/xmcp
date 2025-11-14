import { z } from "zod";
import { DEFAULT_TYPESCRIPT_CONFIG } from "../constants";

// ------------------------------------------------------------
// TypeScript config schema
// ------------------------------------------------------------
export const typescriptConfigSchema = z.object({
  skipTypeCheck: z.boolean().optional(),
});

export type TypescriptConfig = z.infer<typeof typescriptConfigSchema>;
