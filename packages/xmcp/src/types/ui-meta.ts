export interface UIMetadata {
  /**
   * URI template for the widget resource.
   * Auto-generated as `ui://app/{toolName}.html` when omitted.
   */
  resourceUri?: string;

  /**
   * Visibility hint for how prominently hosts should surface the widget entry point.
   */
  visibility?: Array<"model" | "app">;

  /**
   * Content Security Policy configuration for widget resources.
   */
  csp?: {
    connectDomains?: string[];
    resourceDomains?: string[];
    frameDomains?: string[];
    baseUriDomains?: string[];
  };

  /**
   * Browser permission hints requested by the widget iframe.
   */
  permissions?: {
    camera?: Record<string, never>;
    microphone?: Record<string, never>;
    geolocation?: Record<string, never>;
    clipboardWrite?: Record<string, never>;
  };

  /**
   * Optional dedicated origin for this widget.
   */
  domain?: string;

  /**
   * Visual hint indicating the widget prefers a border.
   */
  prefersBorder?: boolean;
}
