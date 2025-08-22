import { z } from "zod";
import { DEFAULT_SERVER_CONFIG } from "../constants";

// ------------------------------------------------------------
// Server config schema
// ------------------------------------------------------------
export const serverConfigSchema = z.object({
  name: z.string().default(DEFAULT_SERVER_CONFIG.name),
  description: z.string().default(DEFAULT_SERVER_CONFIG.description),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;
