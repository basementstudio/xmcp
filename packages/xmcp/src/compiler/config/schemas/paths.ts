import { z } from "zod";

// ------------------------------------------------------------
// Paths config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const pathsConfigBaseSchema = z.object({
  tools: z.union([z.boolean(), z.string()]).default(true),
  prompts: z.union([z.boolean(), z.string()]).default(true),
  resources: z.union([z.boolean(), z.string()]).default(true),
});

// Input schema - all fields optional for partial configs
export const pathsConfigSchema = pathsConfigBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = pathsConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export type PathsConfig = z.infer<typeof pathsConfigSchema>;

// Default path values (used for resolution when boolean is true)
export const DEFAULT_PATHS = {
  tools: "src/tools",
  prompts: "src/prompts",
  resources: "src/resources",
} as const;
