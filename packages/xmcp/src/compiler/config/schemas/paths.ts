import { z } from "zod";
import { DEFAULT_PATHS_CONFIG } from "../constants";

// ------------------------------------------------------------
// Paths config schema
// ------------------------------------------------------------
export const pathsConfigSchema = z.object({
  tools: z.string().default(DEFAULT_PATHS_CONFIG.tools),
  // TO DO add resources prompts etc
});

export type PathsConfig = z.infer<typeof pathsConfigSchema>;
