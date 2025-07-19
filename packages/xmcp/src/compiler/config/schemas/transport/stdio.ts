import { z } from "zod";

// ------------------------------------------------------------
// stdio transport config schema
// ------------------------------------------------------------
export const stdioTransportConfigSchema = z.boolean().optional();

export type StdioTransportConfig = z.infer<typeof stdioTransportConfigSchema>;
