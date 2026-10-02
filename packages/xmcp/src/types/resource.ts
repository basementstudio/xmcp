import { UIMetadata } from "./ui-meta";
import type { CompleteResourceTemplateCallback } from "@modelcontextprotocol/server";

/** Completion callbacks keyed by the resource's URI template parameters. */
export type ResourceCompletions = Record<
  string,
  CompleteResourceTemplateCallback
>;

export interface ResourceMetadata {
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
