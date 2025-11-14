import { z } from "zod";

// ------------------------------------------------------------
// Template config schema
// ------------------------------------------------------------
export const templateConfigSchema = z.object({
  name: z.string().default("xmcp server"),
  description: z
    .string()
    .default(
      "This MCP server was bootstrapped with xmcp. Click the button below to connect to the endpoint."
    ),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
