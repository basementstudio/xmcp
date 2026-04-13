import { z } from "zod/v3";
import { oauthConfigSchema, type OAuthConfig } from "../oauth";

// ------------------------------------------------------------
// Adapter config schema (perhaps a separate file but it's small yet)
// ------------------------------------------------------------
export const adapterConfigSchema = z.enum(["express", "nextjs", "nestjs"]);

export type AdapterConfig = z.infer<typeof adapterConfigSchema>;

// ------------------------------------------------------------
// Experimental features schema
// ------------------------------------------------------------
export const experimentalConfigSchema = z.object({
  adapter: adapterConfigSchema.optional(),
  oauth: z.union([z.literal(false), oauthConfigSchema]).optional(),
});

export type ExperimentalConfig = z.infer<typeof experimentalConfigSchema>;
export { oauthConfigSchema };
export type { OAuthConfig };
