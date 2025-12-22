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
export function hasUIMeta(meta?: Record<string, any>): boolean {
  if (!meta || typeof meta !== "object") {
    return false;
  }

  if ("ui" in meta && typeof meta.ui === "object") {
    return true;
  }

  return false;
}
