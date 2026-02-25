export interface UIMetadata {
  /**
   * URI template for the widget resource.
   * Auto-generated as `ui://app/{toolName}.html` when omitted.
   */
  resourceUri?: string;

  /**
   * Content Security Policy configuration for widget resources.
   */
  csp?: {
    connectDomains?: string[];
    resourceDomains?: string[];
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

