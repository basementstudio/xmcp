import { z } from "zod/v3";

// ------------------------------------------------------------
// TypeScript config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const typescriptConfigBaseSchema = z.object({
  skipTypeCheck: z.boolean().default(false),
});

// Input schema - all fields optional for partial configs
export const typescriptConfigSchema = typescriptConfigBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = typescriptConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export type TypescriptConfig = z.infer<typeof typescriptConfigSchema>;
