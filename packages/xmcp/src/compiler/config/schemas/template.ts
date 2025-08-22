import { z } from "zod";
import { DEFAULT_TEMPLATE_CONFIG } from "../constants";

// ------------------------------------------------------------
// Template config schema
// ------------------------------------------------------------
export const templateConfigSchema = z.object({
  name: z.string().default(DEFAULT_TEMPLATE_CONFIG.name),
  description: z.string().default(DEFAULT_TEMPLATE_CONFIG.description),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
