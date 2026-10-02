import type { ComponentMetadata } from "./component";
import { UIMetadata } from "./ui-meta";

export interface ResourceMetadata extends ComponentMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  /** Metadata for the resource. */
  _meta?: {
    ui?: UIMetadata;
    [key: string]: unknown;
  };
  [key: string]: any;
}
