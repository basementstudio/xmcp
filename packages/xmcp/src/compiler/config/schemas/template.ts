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
   * Icons for the MCP server, matching the MCP spec's `serverInfo.icons` format.
   * When not provided, defaults to the xmcp logo.
   *
   * @example
   * icons: [{ src: "https://example.com/icon.png", mimeType: "image/png" }]
   */
  icons: z
    .array(
      z.object({
        src: z.string(),
        mimeType: z.string().optional(),
        sizes: z.array(z.string()).optional(),
        theme: z.enum(["light", "dark"]).optional(),
      })
    )
    .optional(),
  /**
   * Instructions describing how to use the server and its features.
   *
   * This is sent in the MCP `initialize` response and can be used by clients
   * to improve the LLM's understanding of available tools, resources, etc.
   *
   * Instructions should focus on cross-tool relationships, workflow patterns,
   * and constraints, but should not duplicate information already in tool descriptions.
   *
   * @example
   * instructions: "Use tool-a before tool-b. Always check resources first."
   */
  instructions: z.string().optional(),
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
