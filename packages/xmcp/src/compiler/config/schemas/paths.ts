import { z } from "zod";

// ------------------------------------------------------------
// Paths config schema
// ------------------------------------------------------------
export const pathsConfigSchema = z.object({
  tools: z.union([z.boolean(), z.string()]).default(true),
  prompts: z.union([z.boolean(), z.string()]).default(true),
  resources: z.union([z.boolean(), z.string()]).default(true),
});

export type PathsConfig = z.infer<typeof pathsConfigSchema>;

// Default path values (used for resolution when boolean is true)
export const DEFAULT_PATHS = {
  tools: "src/tools",
  prompts: "src/prompts",
  resources: "src/resources",
} as const;
