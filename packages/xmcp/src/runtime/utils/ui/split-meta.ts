/**
 * Splits UI metadata into tool-specific and resource-specific properties.
 */

export interface SplitMetadata {
  toolMeta: Record<string, any>;
  resourceMeta: Record<string, any>;
}

/**
 * Tool-specific metadata keys in nested format
 */
const TOOL_META_KEYS_NESTED = ["ui/resourceUri"];

/**
 * Resource-specific metadata keys in nested format
 */
const RESOURCE_META_KEYS_NESTED = [
  "prefersBorder",
  "domain",
  "csp",
  "connectDomains",
  "resourceDomains",
];

/**
 * Splits nested UI metadata into tool and resource metadata.
 * Keeps metadata in nested format (no flattening).
 *
 * @param meta - The metadata object (nested format with 'ui' key)
 * @returns Object containing toolMeta and resourceMeta in nested format
 */
export function splitUIMetaNested(meta: Record<string, any>): SplitMetadata {
  const toolMeta: Record<string, any> = {};
  const resourceMeta: Record<string, any> = {};

  if (meta.ui && typeof meta.ui === "object") {
    const uiMeta = meta.ui;
    const toolUI: Record<string, any> = {};
    const resourceUI: Record<string, any> = {};

    for (const [key, value] of Object.entries(uiMeta)) {
      if (TOOL_META_KEYS_NESTED.includes(key)) {
        toolUI[key] = value;
      } else if (RESOURCE_META_KEYS_NESTED.includes(key)) {
        resourceUI[key] = value;
      } else {
        toolUI[key] = value;
      }
    }

    if (Object.keys(toolUI).length > 0) {
      toolMeta.ui = toolUI;
    }
    if (Object.keys(resourceUI).length > 0) {
      resourceMeta.ui = resourceUI;
    }
  }

  for (const [key, value] of Object.entries(meta)) {
    if (key !== "ui") {
      toolMeta[key] = value;
    }
  }

  return { toolMeta, resourceMeta };
}

export function isToolMetaKeyNested(key: string): boolean {
  return TOOL_META_KEYS_NESTED.includes(key);
}

export function isResourceMetaKeyNested(key: string): boolean {
  return RESOURCE_META_KEYS_NESTED.includes(key);
}
