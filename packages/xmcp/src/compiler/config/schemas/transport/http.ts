import * as z from "zod";
import { DEFAULT_HTTP_CONFIG } from "../../constants";

// ------------------------------------------------------------
// Cors config schema
// ------------------------------------------------------------
export const corsConfigSchema = z.object({
  origin: z.union([z.string(), z.array(z.string()), z.boolean()]).optional(),
  methods: z.union([z.string(), z.array(z.string())]).optional(),
  allowedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
  exposedHeaders: z.union([z.string(), z.array(z.string())]).optional(),
  credentials: z.boolean().optional(),
  maxAge: z.number().optional(),
});

export type CorsConfig = z.infer<typeof corsConfigSchema>;

// ------------------------------------------------------------
// HTTP Transport config schema
// ------------------------------------------------------------
export const httpTransportConfigSchema = z.union([
  z.boolean(),
  z
    .object({
      port: z.number().optional(),
      host: z.string().optional(),
      bodySizeLimit: z.number().optional(),
      debug: z.boolean().optional(),
      endpoint: z.string().optional(),
      cors: corsConfigSchema.optional(),
    })
    .prefault(DEFAULT_HTTP_CONFIG)
    .optional(),
]);

export type HttpTransportConfig = z.infer<typeof httpTransportConfigSchema>;
