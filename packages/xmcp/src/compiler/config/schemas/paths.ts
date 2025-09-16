import { z } from "zod";
import { DEFAULT_PATHS_CONFIG } from "../constants";

// ------------------------------------------------------------
// Paths config schema
// ------------------------------------------------------------
export const pathsConfigSchema = z.object({
  tools: z.union([z.boolean(), z.string()]).default(true),
  prompts: z.union([z.boolean(), z.string()]).default(true),
  resources: z.union([z.boolean(), z.string()]).default(true),
});

export type PathsConfig = z.infer<typeof pathsConfigSchema>;
