/**
 * Flattens nested metadata object into a flat structure with "/" delimited keys.
 */
export function flattenMeta(meta: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  function flatten(obj: any, prefix = ""): void {
    if (!obj || typeof obj !== "object") {
      return;
    }

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}/${key}` : key;

      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof RegExp)
      ) {
        flatten(value, newKey);
      } else {
        result[newKey] = value;
      }
    }
  }

  flatten(meta);
  return result;
}

/** Checks if metadata contains UI-specific keys.*/
export function getUIType(
  meta?: Record<string, any>
): "apps" | "openai-apps" | false {
  if (!meta || typeof meta !== "object") {
    return false;
  }

  if ("openai" in meta && typeof meta.openai === "object") {
    return "openai-apps";
  }

  for (const key of Object.keys(meta)) {
    if (key.startsWith("ui/resourceUri")) {
      return "apps";
    } else if (key.startsWith("openai/")) {
      return "openai-apps";
    }
  }

  return false;
}
