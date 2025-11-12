import * as z from "zod";
import { DEFAULT_PATHS_CONFIG } from "../constants";

// ------------------------------------------------------------
// Paths config schema
// ------------------------------------------------------------
export const pathsConfigSchema = z.object({
  tools: z.union([z.boolean(), z.string()]).prefault(true),
  prompts: z.union([z.boolean(), z.string()]).prefault(true),
  resources: z.union([z.boolean(), z.string()]).prefault(true),
});

export type PathsConfig = z.infer<typeof pathsConfigSchema>;
