/**
 * OpenAI tool invocation metadata
 */
export interface OpenAIToolInvocation {
  /**
   * Message displayed while the tool is executing
   * @example "Hand-tossing a map..."
   */
  invoking?: string;

  /**
   * Message displayed after the tool completes
   * @example "Served a fresh map!"
   */
  invoked?: string;
}

/**
 * OpenAI metadata for MCP tools and resources.
 *
 * This interface defines metadata that can be specified in nested form in your tool/resource
 * configuration. The framework will automatically flatten it and split it appropriately:
 *
 * - Tool-specific metadata will be applied to the tool
 * - Resource-specific metadata will be applied to auto-generated resources
 *
 * @example
 * ```typescript
 * // In your tool definition:
 * export const metadata = {
 *   name: "get_map",
 *   description: "Gets a map",
 *   _meta: {
 *     openai: {
 *       // Tool-specific: status messages during execution
 *       toolInvocation: {
 *         invoking: "Hand-tossing a map...",
 *         invoked: "Served a fresh map!"
 *       },
 *       // Tool-specific: enables widget-to-tool communication
 *       widgetAccessible: true,
 *
 *       // Resource-specific: describes the widget
 *       widgetDescription: "Interactive map viewer",
 *       widgetPrefersBorder: true,
 *       widgetCSP: {
 *         connect_domains: ["https://api.mapbox.com"],
 *         resource_domains: ["https://cdn.mapbox.com"]
 *       }
 *     }
 *   }
 * };
 * ```
 */
export interface OpenAIMetadata {
  // ==================== Tool-specific metadata ====================

  /**
   * Tool invocation status messages
   * - `openai/toolInvocation/invoking` - Loading state text (≤64 chars)
   * - `openai/toolInvocation/invoked` - Completion state text (≤64 chars)
   */
  toolInvocation?: OpenAIToolInvocation;

  /**
   * Whether the widget is accessible in the UI (enables widget-to-tool communication)
   * Maps to: `openai/widgetAccessible`
   * @default true
   */
  widgetAccessible?: boolean;

  /**
   * URI template for the widget resource for MCP Apps
   * Maps to: `ui/resourceUri`
   *
   * Auto-generated as `ui://widget/{toolName}.html` if not provided.
   *
   * @example "ui://widget/my-tool.html"
   */
  resourceUri?: string;

  /**
   * URI template for the widget resource
   * Maps to: `openai/outputTemplate`
   *
   * Auto-generated as `ui://widget/{toolName}.html` if not provided.
   *
   * @example "ui://widget/my-tool.html"
   */
  outputTemplate?: string;

  // ==================== Resource-specific metadata ====================

  /**
   * Human-readable widget summary
   * Maps to: `openai/widgetDescription`
   */
  widgetDescription?: string;

  /**
   * UI rendering hint for border preference
   * Maps to: `openai/widgetPrefersBorder`
   */
  widgetPrefersBorder?: boolean;

  /**
   * Content Security Policy configuration
   * Maps to: `openai/widgetCSP`
   *
   * Defines allowed domains for widget resources and connections.
   * These arrays map to CSP directives:
   * - `resource_domains` → script-src, img-src, font-src
   * - `connect_domains` → connect-src
   *
   * Generated CSP:
   * ```
   * script-src 'self' ${resource_domains}
   * img-src 'self' data: ${resource_domains}
   * font-src 'self' ${resource_domains}
   * connect-src 'self' ${connect_domains}
   * ```
   *
   * @example
   * ```typescript
   * widgetCSP: {
   *   connect_domains: ["https://api.example.com"],
   *   resource_domains: ["https://cdn.example.com", "https://fonts.googleapis.com"]
   * }
   * ```
   */
  widgetCSP?: {
    /** URLs allowed for fetch, WebSocket, and other connections (connect-src) */
    connect_domains?: string[];
    /** URLs allowed for scripts, images, and fonts (script-src, img-src, font-src) */
    resource_domains?: string[];
  };

  /**
   * Content Security Policy configuration (mcp-apps-only)
   *
   * Servers declare which external origins their UI needs to access.
   * Hosts use this to enforce appropriate CSP headers.
   */
  csp?: {
    /**
     * Origins for network requests
     *
     * - Empty or omitted = no external connections (secure default)
     * - Maps to CSP `connect-src` directive
     *
     * @example
     * ["https://api.weather.com", "wss://realtime.service.com"]
     */
    connectDomains?: string[];
    /**
     * Origins for static resources (images, scripts, stylesheets, fonts)
     *
     * - Empty or omitted = no external resources (secure default)
     * - Wildcard subdomains supported: `https://*.example.com`
     * - Maps to CSP `img-src`, `script-src`, `style-src`, `font-src` directives
     *
     * @example
     * ["https://cdn.jsdelivr.net", "https://*.cloudflare.com"]
     */
    resourceDomains?: string[];
  };

  /**
   * Optional dedicated subdomain for widget
   * Maps to: `openai/widgetDomain`
   */
  widgetDomain?: string;

  /**
   * Widget state object
   * Maps to: `openai/widgetState`
   */
  widgetState?: UnknownObject;

  // ==================== Shared/deprecated metadata ====================

  /**
   * Whether the result can produce a widget
   * @default true
   */
  resultCanProduceWidget?: boolean;
}

type UnknownObject = {
  [x: string]: unknown;
};
