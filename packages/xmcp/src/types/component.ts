import type { Icon } from "@modelcontextprotocol/server";

/** Metadata shared by tools, prompts, and resources. */
export interface ComponentMetadata {
  /** Icons that clients may display for this component. */
  icons?: Icon[];
  /** Labels exposed as _meta["xmcp/tags"]. */
  tags?: string[];
  /** Set false to skip registration. Defaults to true. */
  enabled?: boolean;
}
