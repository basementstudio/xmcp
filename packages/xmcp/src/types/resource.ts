import { OpenAIMetadata } from "./openai-meta";

export interface ResourceMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  /** Metadata for the resource. Supports nested OpenAI metadata and other vendor extensions. */
  _meta?: {
    openai?: OpenAIMetadata;
    [key: string]: unknown;
  };
  [key: string]: any;
}
