import { z } from "zod/v3";

// ------------------------------------------------------------
// Template config schema
// ------------------------------------------------------------

// Base schema with defaults - used for parsing with defaults applied
const templateConfigBaseSchema = z.object({
  /** The display name of the MCP server shown on the home page */
  name: z.string().default("xmcp server"),
  /** A description of the MCP server shown on the home page */
  description: z
    .string()
    .default("This MCP server was bootstrapped with xmcp."),
  /**
   * Custom home page content for the `/` endpoint.
   *
   * Can be either:
   * - A static HTML string
   * - A path to an HTML file (must end with `.html`, relative to project root)
   *
   * When not provided, the default xmcp home page template is used.
   *
   * @example
   * // Inline HTML
   * homePage: "<html><body><h1>Welcome!</h1></body></html>"
   *
   * @example
   * // File path
   * homePage: "src/home.html"
   */
  homePage: z.string().optional(),
});

// Input schema - all fields optional for partial configs
export const templateConfigSchema = templateConfigBaseSchema
  .partial()
  .transform((val) => {
    // Merge provided values with defaults, filtering out undefined values
    const defaults = templateConfigBaseSchema.parse({});
    const provided = Object.fromEntries(
      Object.entries(val).filter(([_, v]) => v !== undefined)
    );
    return {
      ...defaults,
      ...provided,
    };
  });

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
