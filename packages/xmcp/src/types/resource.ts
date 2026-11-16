import type { ComponentMetadata } from "./component";
import { UIMetadata } from "./ui-meta";
import type {
  CacheHint,
  CompleteResourceTemplateCallback,
} from "@modelcontextprotocol/server";

/** Completion callbacks keyed by the resource's URI template parameters. */
export type ResourceCompletions = Record<
  string,
  CompleteResourceTemplateCallback
>;

export interface ResourceMetadata extends ComponentMetadata {
  name: string;
  title?: string;
  description?: string;
  mimeType?: string;
  size?: number;
  /**
   * Cache hint for `resources/read` results (MCP 2026-07-28). Overrides the
   * server-wide `cacheHints["resources/read"]` field by field. Defaults to
   * `ttlMs: 0` and `cacheScope: "private"`.
   */
  cacheHint?: CacheHint;
  /** Metadata for the resource. */
  _meta?: {
    ui?: UIMetadata;
    [key: string]: unknown;
  };
  [key: string]: any;
}
