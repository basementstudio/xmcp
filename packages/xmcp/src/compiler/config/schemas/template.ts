import { z } from "zod";

// ------------------------------------------------------------
// Template config schema
// ------------------------------------------------------------
// Base schema with defaults - used for parsing with defaults applied
const templateConfigBaseSchema = z.object({
  name: z.string().default("xmcp server"),
  description: z
    .string()
    .default(
      "This MCP server was bootstrapped with xmcp. Click the button below to connect to the endpoint."
    ),
});

// Input schema - all fields optional for partial configs
export const templateConfigSchema = templateConfigBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = templateConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
