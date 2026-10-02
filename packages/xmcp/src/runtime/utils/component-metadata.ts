import type { ComponentMetadata } from "@/types/component";

/** Keep framework options off the wire and put tags in the MCP metadata map. */
export function toMcpMetadata<
  T extends ComponentMetadata & { _meta?: Record<string, unknown> },
>(metadata: T) {
  const { tags, enabled, ...config } = metadata;
  return {
    ...config,
    _meta:
      tags === undefined
        ? config._meta
        : { ...config._meta, "xmcp/tags": tags },
  };
}
