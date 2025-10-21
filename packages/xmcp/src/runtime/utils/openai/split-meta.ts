/**
 * Splits OpenAI metadata into tool-specific and resource-specific properties.
 */

export interface SplitMetadata {
  toolMeta: Record<string, any>;
  resourceMeta: Record<string, any>;
}

/**
 * Tool-specific metadata keys in nested format
 */
const TOOL_META_KEYS_NESTED = [
  "toolInvocation",
  "widgetAccessible",
  "outputTemplate",
];

/**
 * Resource-specific metadata keys in nested format
 */
const RESOURCE_META_KEYS_NESTED = [
  "widgetDescription",
  "widgetPrefersBorder",
  "widgetCSP",
  "widgetDomain",
  "widgetState",
];

/**
 * Splits nested OpenAI metadata into tool and resource metadata.
 * Keeps metadata in nested format (no flattening).
 *
 * @param meta - The metadata object (nested format with 'openai' key)
 * @returns Object containing toolMeta and resourceMeta in nested format
 */
export function splitOpenAIMetaNested(
  meta: Record<string, any>
): SplitMetadata {
  const toolMeta: Record<string, any> = {};
  const resourceMeta: Record<string, any> = {};

  if (meta.openai && typeof meta.openai === "object") {
    const openaiMeta = meta.openai;
    const toolOpenAI: Record<string, any> = {};
    const resourceOpenAI: Record<string, any> = {};

    for (const [key, value] of Object.entries(openaiMeta)) {
      if (TOOL_META_KEYS_NESTED.includes(key)) {
        toolOpenAI[key] = value;
      } else if (RESOURCE_META_KEYS_NESTED.includes(key)) {
        resourceOpenAI[key] = value;
      } else {
        toolOpenAI[key] = value;
      }
    }

    if (Object.keys(toolOpenAI).length > 0) {
      toolMeta.openai = toolOpenAI;
    }
    if (Object.keys(resourceOpenAI).length > 0) {
      resourceMeta.openai = resourceOpenAI;
    }
  }

  for (const [key, value] of Object.entries(meta)) {
    if (key !== "openai") {
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
