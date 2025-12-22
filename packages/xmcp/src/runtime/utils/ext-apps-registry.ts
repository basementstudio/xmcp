import { UserToolHandler } from "./transformers/tool";

interface UIResourceMeta {
  /**
   * Content Security Policy configuration
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
   * Dedicated origin for widget
   *
   * Optional domain for the widget's sandbox origin. Useful when widgets need
   * dedicated origins for API key allowlists or cross-origin isolation.
   *
   * If omitted, Host uses default sandbox origin.
   *
   * @example
   * "https://weather-widget.example.com"
   */
  domain?: string;
  /**
   * Visual boundary preference
   *
   * Boolean indicating the UI prefers a visible border. Useful for widgets
   * that might blend with host background.
   *
   * - `true`: Request visible border (host decides styling)
   * - `false` or omitted: No preference
   */
  prefersBorder?: boolean;
}

interface UIResource {
  /**
   * Unique identifier for the UI resource
   *
   * MUST use the `ui://` URI scheme to distinguish UI resources from other
   * MCP resource types.
   *
   * @example
   * "ui://weather-dashboard"
   */
  uri: string;

  /**
   * Human-readable display name for the UI resource
   *
   * Used for listing and identifying the resource in host interfaces.
   *
   * @example
   * "Weather Dashboard"
   */
  name: string;

  /**
   * Optional description of the UI resource's purpose and functionality
   *
   * Provides context about what the UI does and when to use it.
   *
   * @example
   * "Interactive weather visualization with real-time updates"
   */
  description?: string;

  /**
   * MIME type of the UI content
   *
   * SHOULD be `text/html;profile=mcp-app` for HTML-based UIs in the initial MVP.
   * Other content types are reserved for future extensions.
   *
   * @example
   * "text/html;profile=mcp-app"
   */
  mimeType: "text/html;profile=mcp-app";

  /**
   * Resource metadata for security and rendering configuration
   *
   * Includes Content Security Policy configuration, dedicated domain settings,
   * and visual preferences.
   */
  _meta?: {
    ui?: UIResourceMeta;
  };
  /**
   * Path to the tool file (for React bundling)
   */
  toolPath?: string;
  /**
   * Tool handler function
   */
  handler: UserToolHandler;
}

class UIResourceRegistry {
  private resources = new Map<string, UIResource>();

  /**
   * Add a resource to the registry
   */
  add(toolName: string, resource: UIResource): void {
    this.resources.set(toolName, resource);
  }

  /**
   * Get all registered resources
   */
  getAll(): Map<string, UIResource> {
    return this.resources;
  }

  /**
   * Clear all resources (useful for testing or reinitialization)
   */
  clear(): void {
    this.resources.clear();
  }

  /**
   * Check if a resource exists
   */
  has(toolName: string): boolean {
    return this.resources.has(toolName);
  }
}

export const uIResourceRegistry = new UIResourceRegistry();
