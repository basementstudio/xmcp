import { OpenAIMetadata } from "./openai-meta";

export interface ResourceMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  /** Metadata for the resource. Supports nested OpenAI metadata and other vendor extensions. */
  _meta?: {
    /**
     * Unified UI metadata for both MCP Apps and OpenAI widgets.
     * Prefer configuring this object for all visual resources.
     */
    ui?: OpenAIMetadata;
    /** @deprecated Configure `ui` instead. Preserved for backward compatibility. */
    openai?: OpenAIMetadata;
    [key: string]: unknown;
  };
  [key: string]: any;
}
