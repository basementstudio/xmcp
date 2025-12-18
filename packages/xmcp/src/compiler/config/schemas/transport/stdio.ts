import { z } from "zod/v3";

// ------------------------------------------------------------
// stdio transport config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const stdioTransportObjectBaseSchema = z.object({
  debug: z.boolean().default(false),
});

// Input schema - all fields optional for partial configs
const stdioTransportObjectSchema = stdioTransportObjectBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = stdioTransportObjectBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export const stdioTransportConfigSchema = z
  .union([z.boolean(), stdioTransportObjectSchema])
  .optional();

export type StdioTransportConfig = z.infer<typeof stdioTransportConfigSchema>;
