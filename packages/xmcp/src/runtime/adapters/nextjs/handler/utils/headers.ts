import type { OutgoingHttpHeaders } from "node:http";

export type NormalizedHeaders = Array<[string, string]>;

/**
 * Normalizes Node.js OutgoingHttpHeaders to a format compatible with Web Response headers.
 * Handles arrays, undefined values, and various header formats.
 */
export function normalizeHeaders(
  headers?: OutgoingHttpHeaders
): NormalizedHeaders | undefined {
  if (!headers) {
    return undefined;
  }

  const normalized: NormalizedHeaders = [];

  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const entry of value) {
        if (entry === undefined) {
          continue;
        }
        normalized.push([key, String(entry)]);
      }
      continue;
    }

    normalized.push([key, String(value)]);
  }

  return normalized.length > 0 ? normalized : undefined;
}
