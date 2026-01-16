import { z } from "zod/v3";

// ------------------------------------------------------------
// Adapter config schema (perhaps a separate file but it's small yet)
// ------------------------------------------------------------
export const adapterConfigSchema = z.enum(["express", "nextjs"]);

export type AdapterConfig = z.infer<typeof adapterConfigSchema>;

// ------------------------------------------------------------
// Experimental features schema
// ------------------------------------------------------------
export const experimentalConfigSchema = z.object({
  adapter: adapterConfigSchema.optional(),
});

export type ExperimentalConfig = z.infer<typeof experimentalConfigSchema>;
